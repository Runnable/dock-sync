var async = require('async');
var url = require('url');
var path = require('path');
var pick = require('map-utils').pick;
var ApiClient = require('simple-api-client');
var last = require('./last');
var docker = require('./docker');
var imageNameParse = require('./imageNameParse');
var streamDone = require('./streamDone');
module.exports = DockerRegistry;


// Registry

function DockerRegistry (urlOrImage) {
  if (typeof urlOrImage === 'string') {
    this.url = urlOrImage;
  }
  else {
    var parsed = imageNameParse(image);
    this.url = parsed.registry;
  }
}

require('util').inherits(DockerRegistry, ApiClient);

DockerRegistry.prototype.getRepo = function (name) {
  return new Repo(this.url, name);
};

DockerRegistry.prototype.getImage = function (imageId) {
  return new Image(this.url, imageId);
};

// Static methods [opts, ] image, cb
DockerRegistry.getImageState = function (opts, image, cb) {
  if (opts.Id) {
    image = opts;
    opts = {};
  }
  if (!image.RepoTags || image.RepoTags.length === 0) {
    console.error('this image is corrupt?', image);
    throw new Error('what is this weird image ', image.Id);
  }
  var parsed = imageNameParse(image);
  var registry = new DockerRegistry(parsed.registry);
  console.log(last(image.RepoTags), image.Id);

  if (opts.pub && !opts.priv) {
    if (parsed.registry !== 'http://index.docker.io') {
      return cb(); //block
    }
  }
  if (opts.priv && !opts.pub) {
    if (parsed.registry === 'http://index.docker.io') {
      return cb(); //block
    }
  }
  registry.getRepo(parsed.name).getTags(function (err, res, body) {
    if (err) {
      cb(err); // TODO: retry on error
    }
    else {
      if (res.statusCode === 404) {
        console.log('- [ PUSH ▲ ] missing in registry');
        cb(null, 'push');
      }
      else if (!body.latest) {       // TODO: else if (!body || (!body.latest && !body.RepoTags)) {
        console.error('- [ PUSH ▲ ] unexpected repo tags in registry');
        cb(null, 'push'); // overwrite registry
      }
      else {
        // Ive seen different formats here.... w/ public registry
        var latestId = body.latest;   // TODO: || findWhere(body.RepoTags, { name: 'latest' });
        if (latestId === image.Id) {  // TODO: latestId = latestId.layer || latestId;
          cb(); // in sync            // TODO: else find as other tag
        }
        else {
          checkAncestry(image, latestId, cb);
        }
      }
    }
  });

  function checkAncestry (image, latestId, cb) {
    var registryImage = registry.getImage(latestId);
    registryImage.getAncestry(function (err, res, body) {
      if (err) {
        cb(err); // TODO: retry on error
      }
      else if (res.statusCode === 404) {
        // i noticed the public registry having issues here
        cb(new Error('Image ancestry for '+latestId+' is 404ing'));
      }
      else if (~body.indexOf(image.Id)) {
        console.log('- [ ▼ PULL ] image is ancestor of registry latest');
        cb(null, 'pull'); // needs pull
      }
      else {
        // body.length === 0 || ancestry does not contain imageId
        // either needs push or completely different repo...
        // assume not completely different

        // console.error('\nUnexpected Image Ancestry (registry) for', parsed.name, '-', latestId, 'expected to contain', image.Id, ':\n', body, '\n\n');
        // cb(); // no action
        compareCreatedDates(image, registryImage, cb);
      }
    });
  }

  function compareCreatedDates (image, registryImage, cb) {
    registryImage.inspect(function (err, res, body) {
      if (err) {
        cb(err); // TODO: retry on error
      }
      else if (res.statusCode === 404) {
        // this should not be possible, based on order of events
        cb(new Error('Image info for '+latestId+' is 404ing'));
      }
      else {
        var imageCreated         = unixTime(image.Created*1000);
        var registryImageCreated = unixTime(body.created);
        if (!image.Created) {
          console.error('- [ ??? ] unexpected local created date');
          cb();
        }
        else if (!body.created) {
          console.error('- [ ??? ] unexpected registry created date');
          cb();
        }
        else if (imageCreated > registryImageCreated) {
          console.log('- [ PUSH ▲ ] image is newer than registry latest -', imageCreated, registryImageCreated);
          cb(null, 'push');
        }
        else {
          console.log('- [ ▼ PULL ] image is older than registry latest -', imageCreated, registryImageCreated);
          cb(null, 'pull');
        }
      }
    });
  }
};
// split sync out bc we want it to happen in series
DockerRegistry.syncWithRegistry = function (images, actions, cb, opts) {
  opts = opts || {};
  limit = opts.concurrency || 1;
  var i = 0;

  async.eachLimit(images, limit, function (image, cb) {
    var parsed = imageNameParse(image);
    var action = actions[i];
    i++;
    if (opts.dryrun) {
      if (typeof action !== 'string') return cb();
      var niceAction = (action === 'pull') ?
        '▼ Pulling -' : 'Pushing ▲ -';
      console.log('Dryrun!', niceAction, image.Id, 'for', last(image.RepoTags));
      return cb();
    }
    if (typeof action === 'string') { // can be error or null (synced)
      if (action === 'pull') {
        // console.log('▼ Pulling -', parsed.fullName, 'from', parsed.registry, '-', image.Id);
        // docker.pull(parsed.fullName, {
        //   registry: parsed.registry
        // }, streamDone(handleError));

        // TODO: only logs currently!
        console.log('sudo docker -H 127.0.0.1:4242 pull', parsed.fullName+':latest');
        cb();
      }
      else if (action === 'push') {
        // console.log('Pushing ▲ -', parsed.fullName, 'to', parsed.registry, '-', image.Id);
        // docker.getImage(parsed.fullName).push({
        //   registry: parsed.registry
        // }, streamDone(handleError));

        // TODO: only logs currently!
        console.log('sudo docker -H 127.0.0.1:4242 push', parsed.fullName+':latest');
        cb();
      }
    }
    function handleError (err) {
      if (opts.bail) {
        cb(err);
      }
      else {
        console.error(err.stack || err);
        cb();
      }
    }
  }, cb);
};

// Registry Repository

function Repo (registry, name) {
  var parsed = url.parse(registry);
  this.url = url.format({
    protocol: parsed.protocol,
    host: parsed.host,
    pathname: path.join('/v1/repositories', name)
  });
}

require('util').inherits(Repo, ApiClient);

Repo.prototype.getTags = function (cb) {
  this.get('/tags', {json:true}, cb);
};


// Registry Image

function Image (registry, imageId) {
  var parsed = url.parse(registry);
  this.url = url.format({
    protocol: parsed.protocol,
    host: parsed.host,
    pathname: path.join('/v1/images', imageId)
  });
}

require('util').inherits(Image, ApiClient);

Image.prototype.getAncestry = function (cb) {
  this.get('/ancestry', {json:true}, cb);
};

Image.prototype.inspect = function (cb) {
  this.get('/json', {json:true}, cb);
};



function capitalize (s) {
  return s[0].toUpperCase() + s.slice(1);
}

function findWhere (arr, obj) {
  return find(arr, function (item) {
    return Object.keys(obj).every(function (key) {
      return obj[key] === item[key];
    });
  });
}

function find(arr, fn) {
  var found;
  arr.some(function (item, i, arr) {
    if (fn(item, i, arr)) {
      found = item;
      return true;
    }
  });
  return found;
}

function unixTime (date) {
  return (new Date(date)).getTime();
}
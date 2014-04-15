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
      cb(err);
    }
    else {
      if (res.statusCode === 404) {
        cb(null, 'push');
      }
      // else if (!body.RepoTags || body.RepoTags.length === 0) {
      //   console.log(typeof body);
      //   console.log(body);
      //   console.error('this image repo is corrupt?', image);
      //   throw new Error('what is this weird image ', image.Id);
      // }
      else {
        // Ive seen different formats here....
        var latestId = body.latest || findWhere(body.RepoTags, { name: 'latest' });
        latestId = latestId.layer || latestId;
        if (!latestId) {
          console.error('NO LATEST', body); // this should not be possible
          cb();
        }
        else if (latestId === image.Id) {
          cb(); // in sync
        }
        else {
          checkAncestry(latestId, cb);
        }
      }
    }
  });

  function checkAncestry (latestId, cb) {
    registry.getImage(latestId).getAncestry(function (err, res, body) {
      if (err) {
        return cb(err);
      }
      else if (res.statusCode === 404) {
        // i noticed the public registry having issues here
        cb(new Error('Image ancestry for '+latestId+' is 404ing'));
      }
      else if (~body.indexOf(image.Id)) {
        cb(null, 'pull'); // needs pull
      }
      else { // body.length === 0 || ancestry does not contain imageId
        // either needs push or completely different repo...
        // assume not completely different
        console.error('Unexpected State Found: '+latestId);
        cb(); // no action
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
    if (opts.dryrun) {
      console.log('Dryrun! '+capitalize(action)+'ing: '+image.Id+' for '+last(image.RepoTags));
      return cb();
    }
    if (typeof action === 'string') { // can be error or null (synced)
      if (action === 'pull') {
        docker.pull(parsed.fullName, streamDone(cb));
        console.log('Pulling: '+image.Id+' for '+last(image.RepoTags));
      }
      else if (action === 'push') {
        docker.getImage(parsed.fullName).push({}, streamDone(cb));
        console.log('Pushing: '+image.Id+' for '+last(image.RepoTags));
      }
      else { // remove me i am used for debug.
        var err = new Error(image.Id+' unknown action '+action);
        console.error(err.stack);
        cb();
      }
    }
    i++;
  }, cb);

  function next (err) {
    if (err) {
      handleError(err, cb);
    }
    else {
      cb();
    }
  }
  function handleError (err, cb) {
    if (opts.bail) {
      cb(err);
    }
    else {
      console.error(err.stack || err);
      cb();
    }
  }
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
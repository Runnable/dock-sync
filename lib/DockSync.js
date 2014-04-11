var Docker = require('dockerode');
var DockerRegistry = require('./DockerRegistry');
var async = require('async');
var map = require('./map');
var isFunction = require('validate-type').isFunction;
var isString = require('validate-type').isString;
var last = require('./last');
var parseDockerHost = require('./parseDockerHost');


module.exports = DockSync;

function DockSync (opts) {
  this.dryrun = opts.dryrun;
  opts.host = opts.host || process.env.DOCKER_HOST || '/var/run/docker.sock';
  this.docker = new Docker(parseDockerHost(opts.host));
  this.bailOnError = opts.bail;
  this.priv = opts.private;
  opts.pub  = opts.public;
}

DockSync.prototype.start = function () {
  async.waterfall([
    this.getImages.bind(this),
    this.syncImages.bind(this)
  ], this.exit);
};

DockSync.prototype.getImages = function (cb) {
  this.docker.listImages(cb);
};

DockSync.prototype.syncImages = function (images, cb) {
  images = images.filter(function (image) {
    return last(image.RepoTags) !== '<none>:<none>';
  });
  var exit   = this.exit;
  var docker = this.docker;
  var bail   = this.bailOnError;
  var dryrun = this.dryrun;
  var priv   = this.priv;
  var pub    = this.pub;

  var opts = {
    priv: this.priv,
    pub : this.pub
  };
  var getImageState = DockerRegistry.getImageState.bind(DockerRegistry, opts);

  map(images, getImageState, next, { bail: bail });
  function next (err, registryActions) {
    if (err) {
      if (bailOnError) {
        return exit(err);
      }
      else {
        console.error(err.stack || err);
      }
    }
    images = images.filter(actionIsTruthy(registryActions));
    registryActions = registryActions.filter(truthy);
    DockerRegistry.syncWithRegistry(images, registryActions, cb, {
      bail: bail,
      concurrency: 1,
      dryrun: dryrun
    });
  }
};

DockSync.prototype.exit = function (err) {
  if (err) { //bail
    console.error(err.stack || err);
    process.exit(1);
  }
  else {
    console.log('\nDone!');
    process.exit();
  }
};

function actionIsTruthy (actions) {
  return function (image, i) {
    return Boolean(actions[i]);
  };
}

function truthy (v) {
  return Boolean(v);
}
var async = require('async');
var docker = require('../../lib/docker');
var createCount = require('callback-count');
var pluck = require('map-utils').pluck;
var registry = require('simple-api-client')('http://localhost:5000');

var existingImages = {};
var existingContainers = {};

var dockerState = module.exports = {};

// init
dockerState.init = function (cb) {
  var count = createCount(2, cb);
  docker.listContainers(initContainers);
  docker.listImages(initImages);

  function initContainers (err, containers) {
    if (err) return count.next(err);
    containers.map(pluck('Id')).forEach(function (key) {
      existingContainers = {};
      existingContainers[key] = true;
    });
    count.next();
  }
  function initImages (err, images) {
    if (err) return count.next(err);
    images.map(pluck('Id')).forEach(function (key) {
      existingImages = {};
      existingImages[key] = true;
    });
    count.next();
  }
};

// cleanup
dockerState.cleanup = function (cb) {
  // var count = createCount(1, cb);
  cleanupContainers(function (err) {
    if (err) return cb(err);
    cleanupImages(cb);
  });
  // cleanupRegistry(count.next);
};

function cleanupContainers (cb) {
  docker.listContainers(stopAndRemove);
  function stopAndRemove (err, containers) {
    if (err) return cb(err);
    async.forEach(containers, function (container, cb) {
      if (existingContainers[container.Id]) {
        return cb(); // keep it.
      }
      container = docker.getContainer(container.Id);
      async.series([
        container.stop.bind(container),
        container.remove.bind(container)
      ], cb);
    }, cb);
  }
}

function cleanupImages (cb) {
  var count = createCount(2, cb);
  // remove all images
  docker.listImages(remove);
  // delete repo from registry
  removeRegistryImage(count.next);
  function remove (err, images) {
    if (err) return cb(err);
    async.forEach(images, function (image, cb) {
      if (existingImages[image.Id]) {
        return cb(); // keep it.
      }
      image = docker.getImage(image.Id);
      image.remove(function (err) {
        cb(); // flakey. ignore error for now.
      });
    }, count.next);
  }
}

function removeRegistryImage (cb) {
  registry.del('/v1/repositories/namespace/repo/tags', cb);
}
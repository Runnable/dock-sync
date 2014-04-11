var async = require('async');
var docker = require('../lib/docker');
var runDockSync = require('./fixtures/runDockSync');
var createLocalRepo = require('./fixtures/createLocalRepo');
var deleteRepoEverywhere = require('./fixtures/deleteRepoEverywhere');
var alreadyRunningContainers = require('./fixtures/alreadyRunningContainers');
var registry = require('simple-api-client')('http://localhost:5000');
var createCount = require('callback-count');
var pluck = require('map-utils').pluck;
require('console-trace')({always:true, right:true});

describe('push', function() {
  beforeEach(function (done) {
    var self = this;
    initAlreadyRunning(function (err) {
      if (err) return done(err);
      self.repoName = '/namespace1/repo1';
      self.repo = 'localhost:5000'+self.repoName;
      async.series([
        deleteRepoEverywhere.bind(null, self.repo),
        createLocalRepo.bind(null, self.repo)
      ], done);
    });
  });
  afterEach(function (done) {
    var count = createCount(done);
    var self = this;
    stopAndDeleteAllContainers(function (err) {
      if (err) return done(err);
      deleteRepoEverywhere(self.repo, done);
    });
  });
  it('should push a local image if it is missing from the registry', function(done) {
    this.timeout(20*1000);
    var repoName = this.repoName;
    var dockSync = runDockSync({ private: true });
    dockSync.on('exit', function (code) {
      if (code) return done(new Error('code: '+code));
      getRepoLatestTag(repoName, function (err, body) {
        if (err) return done(err);
        done();
      });
    });
  });
  it('should push a local image if has newer tags than the registry', function (done) {
    var self = this;
    var repoName = this.repoName;
    createLocalRepo(this.repo, { from:this.repo }, function (err) {
      if (err) return done(err);

      var dockSync = runDockSync({ private: true });
      dockSync.on('exit', function (code) {
        if (code) return done(new Error('code: '+code));

        getRepoLatestTag(repoName, function (err, body) {
          if (err) return done(err);

          docker.getImage(self.repo).inspect(function (err, data) {
            if (err) return done(err);
            body.should.equal(data.id);
            done();
          });
        });
      });
    });
  });
  // it('should not do anything when it finds something wierd', function (done) {

  // });
});

function getRepoLatestTag (repoName, cb) {
  registry.get(['/v1/repositories/', repoName ,'/tags/latest'], function (err, res, body) {
    if (err) return cb(err);
    if (res.statusCode === 404) return cb(new Error('image missing in registry'));
    cb(null, JSON.parse(body));
  });
}

function stopAndDeleteAllContainers (cb) {
  docker.listContainers(function(err, containers) {
    async.forEach(containers, function (container) {
      if (alreadyRunningContainers[container.Id]) return cb();
      var count = createCount(cb);
      container = docker.getContainer(container.Id);
      container.stop(function (err) {
        if (err)return cb(err);
        container.remove(function (err) {
          cb(); // ignore error.. its flakey.
        });
      });
    }, cb);
  });
}

function initAlreadyRunning (cb) {
  docker.listContainers(function(err, containers) {
    if (err) return cb(err);
    containers.map(pluck('Id')).forEach(function (containerId) {
      resetAlreadyRunningContainers();
      alreadyRunningContainers[containerId] = true;
    });
    stopAndDeleteAllContainers(function (err) {
      cb(err, containers);// ignore err
    });
  });
}

function resetAlreadyRunningContainers () {
  Object.keys(alreadyRunningContainers).forEach(function (key) {
    delete alreadyRunningContainers[key]; // reset
  });
}
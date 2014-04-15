var Lab = require('lab');
var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;
var beforeEach = Lab.beforeEach;
var afterEach  = Lab.afterEach;

var async = require('async');
var docker = require('../lib/docker');
var runDockSync = require('./fixtures/runDockSync');
var createLocalRepo = require('./fixtures/createLocalRepo');
var registry = require('simple-api-client')('http://localhost:5000');
var createCount = require('callback-count');
var pluck = require('map-utils').pluck;
var dockerState = require('./fixtures/dockerState');
require('console-trace')({always:true, right:true});

describe('push', function() {
  beforeEach(function (done) {
    var self = this;
    dockerState.init(function (err) {
      if (err) return done(err);
      self.repoName = '/namespace/repo';
      self.repo = 'localhost:5000'+self.repoName;
      async.series([
        dockerState.cleanup.bind(dockerState),
        createLocalRepo.bind(null, self.repo)
      ], done);
    });
  });
  afterEach(function (done) {
    delete this.repoName;
    delete this.repo;
    dockerState.cleanup(done);
  });
  it('should push a local image if it is missing from the registry', function (done) {
    console.log('should push a local image if it is missing from the registry');
    var self = this;
    var dockSync = runDockSync({ private: true });
    dockSync.on('exit', function (code) {
      if (code) return done(new Error('code: '+code));
      assertLocalAndRegistryMatch(self, done);
    });
  });
  describe('newer image', function() {
    beforeEach(function (done) {
      this.repoName = '/namespace/repo';
      this.repo = 'localhost:5000'+this.repoName; // same as above
      createLocalRepo(this.repo, { from:this.repo }, done); // create new
    });
    afterEach(function (done) {
      delete this.repoName;
      delete this.repo;
      done();
    });
    it('should push a local image if has newer tags than the registry', function (done) {
      console.log('should push a local image if has newer tags than the registry');
      var self = this;
      var dockSync = runDockSync({ private: true });
      dockSync.on('exit', function (code) {
        if (code) return done(new Error('code: '+code));
        assertLocalAndRegistryMatch(self, done);
      });
    });
  });
});



function assertLocalAndRegistryMatch (opts, cb) {
  latestRegistryTag(opts.repo, function (err, body) {
    if (err) return cb(err);
    docker.getImage(opts.repoName).inspect(function (err, data) {
      if (err) return cb(err);
      expect(body).to.equal(data.id);
      cb();
    });
  });
}

function latestRegistryTag (repoName, cb) {
  registry.get(['/v1/repositories/', repoName ,'/tags/latest'], function (err, res, body) {
    if (err) return cb(err);
    if (res.statusCode === 404) return cb(new Error('image missing in registry'));
    cb(null, body);
  });
}
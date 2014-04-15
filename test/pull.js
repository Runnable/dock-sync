var async = require('async');
var Lab = require('lab');
var dockerState = require('./fixtures/dockerState');
var describe = Lab.experiment;
var it = Lab.test;
var beforeEach = Lab.beforeEach;
var afterEach = Lab.afterEach;

var docker = require('../lib/docker');
var streamDone = require('../lib/streamDone');
var createCount = require('callback-count');
var runDockSync = require('./fixtures/runDockSync');
var createLocalRepo = require('./fixtures/createLocalRepo');
var registry = require('simple-api-client')('http://localhost:5000');

describe('pull', function() {
  beforeEach(function (done) {
    var self = this;

    dockerState.init(function (err) {
      if (err) return done(err);
      self.repoName = '/namespace/repo';
      self.repo = 'localhost:5000'+self.repoName;
      async.series([
        dockerState.cleanup.bind(dockerState),
        createLocalRepo.bind(null, self.repo),
        getFirstTaggedId,
        createLocalRepo.bind(null, self.repo, { from: self.repo }),
        pushRepoToRegistry,
        revertLocalRepo
      ], done);
    });
    function getFirstTaggedId (cb) {
      docker.getImage(self.repo).inspect(function (err, image) {
        if (err) return cb(err);
        self.firstTaggedId = image.id;
        cb();
      });
    }
    function pushRepoToRegistry (cb) {
      docker.getImage(self.repo).push({}, streamDone(cb));
    }
    function revertLocalRepo (cb) {
      var count = createCount(cb);
      // remove latest
      docker.getImage(self.repo).remove(count.inc().next);
      // tag older as latest
      docker.getImage(self.firstTaggedId).tag({
        repo: self.repo
      }, count.inc().next);
    }
  });
  afterEach(function (done) {
    delete this.repoName;
    delete this.repo;
    delete this.firstTaggedId;
    dockerState.cleanup(done);
  });
  it('should pull an image if it has older tags than the registry', function (done) {
    console.log('should pull an image if it has older tags than the registry');
    var self = this;
    var dockSync = runDockSync({ private: true });
    dockSync.on('exit', function (code) {
      if (code) return done(new Error('code: '+code));
      assertLocalAndRegistryMatch(self, done);
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
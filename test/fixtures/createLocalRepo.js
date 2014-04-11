var docker = require('../../lib/docker');
var noop = function  () {};
var tar = require('tar-stream');

module.exports = function createLocalRepo (tag, opts, done) {
  if (typeof opts === 'function') {
    done = opts;
    opts = {};
    opts.from = 'ubuntu';
  }
  var pack = tar.pack();
  pack.entry({ name: './', type: 'directory' });
  pack.entry({ name: './Dockerfile' }, 'FROM '+opts.from+'\nCMD /bin/bash echo $RANDOM > hello.txt\n');
  pack.finalize();
  docker.buildImage(pack, { t: tag }, function (err, res) {
    if (err) {
      done(err);
    }
    else {
      res.on('data', noop);
      res.on('error', done);
      res.on('end', function (data) {
        done();
      });
    }
  });
};
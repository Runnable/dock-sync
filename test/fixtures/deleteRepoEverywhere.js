var docker = require('../../lib/docker');
var createCount = require('callback-count');
var registry = require('simple-api-client')('http://localhost:5000');

module.exports = function deleteEverywhere (name, done) {
  var count = createCount(2, done);
  docker.getImage(name).remove(function (err) {
    var cb = count.next;
    err = ignore404(err);
    cb(); // ignore error for now its flakey
  });
  registry.del(['/v1/repositories/', name], function (err) {
    var cb = count.next;
    err = ignore404(err);
    cb(err);
  });
};

function ignore404 (err) {
  if (err && err.statusCode === 404) {
    err = null;
  }
  return err;
}
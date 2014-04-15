module.exports = streamDone;

function streamDone (cb) {
  var noop = function  () {};
  return function (err, stream) {
    if (err) {
      console.log(err);
      cb(err);
    }
    else {
      stream.on('data', noop);
      stream.on('error', cb);
      stream.on('end', function (data) {
        cb();
      });
    }
  };
}
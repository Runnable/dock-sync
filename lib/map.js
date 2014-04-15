var createCount = require('callback-count');
var async = require('async');

module.exports = map;


function map (arr, fn, cb, opts) {
  var bail = opts.bail;
  var count = createCount(arr.length, done);
  var out = [];
  var index = -1;
  async.eachLimit(arr, 1, function (item, cb) {
    index++;
    var i = index;
    fn(item, function (err, result) {
      if (err) {
        if (bail) {
          cb(err);
        }
        else {
          console.error(err.stack || err);
          out[i] = err;
          cb();
        }
      }
      else {
        out[i] = result;
        cb();
      }
    });
  }, done);
  function done (err) {
    cb(err, out);
  }
}
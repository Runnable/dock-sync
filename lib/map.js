var createCount = require('callback-count');

module.exports = map;


function map (arr, fn, cb, opts) {
  var bail = opts.bail;
  var count = createCount(arr.length, done);
  var out = [];

  arr.forEach(function (item, i) {
    fn(item, function (err, bool) {
      if (err) {
        if (bail) {
          count.next(err);
        }
        else {
          console.error(err.stack || err);
          out[i] = err;
          count.next();
        }
      }
      else {
        out[i] = bool;
        count.next();
      }
    });
  });

  function done (err) {
    cb(err, out);
  }
}
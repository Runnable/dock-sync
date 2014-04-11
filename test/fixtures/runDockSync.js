var spawn = require('child_process').spawn;
var path = require('path');

module.exports = function (opts) {
  opts = opts || {};
  var args = optsToArgs(opts);
  var cwd = path.resolve(__dirname, '..', '..', 'bin');
  var dockSync = spawn('./dock-sync', args, { cwd: cwd });
  dockSync.stdout.pipe(process.stdout);
  dockSync.stderr.pipe(process.stdout);
  return dockSync;
};

function optsToArgs (opts) {
  return Object.keys(opts).reduce(function (arr, key) {
    arr.push('--'+key);
    if (opts[key] !== true) {
      arr.push(opts[key]);
    }
    return arr;
  }, []);
}
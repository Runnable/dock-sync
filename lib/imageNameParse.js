var url = require('url');
var last = require('./last');
var pick = require('map-utils').pick;

module.exports = function imageNameParse (image) {
  var imageName = (typeof image === 'string') ?
    image :
    last(image.RepoTags);

  var out = {};

  out.fullName = imageName;

  var shortName = new RegExp(/^([^\/]+)\/([^:\/]+)(:.*)?$/);
  var superShortName = !~imageName.indexOf('/');
  if (shortName.test(imageName) || superShortName) { // (or super short name no slashes)
    // do nothing
  }
  else if (!~imageName.indexOf('://')) {
    imageName = 'http://' + imageName;
  }

  if (superShortName) {
    out.registry = 'http://index.docker.io';
    out.name = imageName.split(':').shift();
  }
  else {
    var parsed = url.parse(imageName);

    if (parsed.host) {
      out.registry = url.format(pick('protocol', 'host')(parsed));
      out.name = parsed.path.split(':').shift().slice(1);
    }
    else {
      out.registry = 'http://index.docker.io';
      out.name = parsed.path.split(':').shift();
    }
  }

  var host = url.parse(out.registry).host;
  if (host === 'index.docker.io') host = null;
  out.fullName = host ? host +'/'+ out.name : out.name;

  return out;
};
var url = require('url');
var pick = require('map-utils').pick;

module.exports = function parseDockerHost (host) {
  var parsed = url.parse(host);
  var out = {};
  if (parsed.host) {          // ex: unix:///var/run/docker.sock
    if (~parsed.protocol.indexOf('unix')) {
      out.socketPath = url.format(pick('host', 'path')(parsed));
      return out;
    }
    else {                    // ex: http://localhost:4243
      if (parsed.protocol === 'tcp:') parsed.protocol = 'http:';
      out.host = url.format(pick('protocol', 'hostname')(parsed));
      out.port = parsed.port || 4243;
      return out;
    }
  }
  else if (host[0] === '/') { // ex: /var/run/docker.sock
    out.socketPath = host;
  }
  else {                      // ex: localhost:4243
    if (parsed.protocol === 'tcp:') parsed.protocol = 'http:';
    parsed = url.parse('http://'+host);
    out.host = url.format(pick('protocol', 'hostname')(parsed));
    out.port = parsed.port || 4243;
    return out;
  }
};
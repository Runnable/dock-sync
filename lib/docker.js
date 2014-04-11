var Docker = require('dockerode');

module.exports = new Docker({
  host: 'http://localhost',
  port: '4243'
});
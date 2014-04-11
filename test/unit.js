var imageNameParse = require('imageNameParse');

describe('imageNameParse', function() {
  it('should parse an full image name (w/ port, tag)', function() {
    imageNameParse('localhost:4243/runnable/php:latest')
      .should.eql({
        name: 'runnable/php',
        fullName: 'localhost:4243/runnable/php',
        registry: 'http://localhost:4243'
      });
  });
  it('should parse an full image name (w/ port, no tag)', function() {
    imageNameParse('localhost:4243/runnable/php')
      .should.eql({
        name: 'runnable/php',
        fullName: 'localhost:4243/runnable/php',
        registry: 'http://localhost:4243'
      });
  });
  it('should parse an full image name (no port, w/ tag)', function() {
    imageNameParse('localhost/runnable/php:latest')
      .should.eql({
        name: 'runnable/php',
        fullName: 'localhost/runnable/php',
        registry: 'http://localhost'
      });
  });
  it('should parse an full image name (no port, no tag)', function() {
    imageNameParse('localhost/runnable/php')
      .should.eql({
        name: 'runnable/php',
        fullName: 'localhost/runnable/php',
        registry: 'http://localhost'
      });
  });
  it('should parse an full image name (w/ port, tag)', function() {
    imageNameParse('registry.runnable.com:4243/runnable/php:latest')
      .should.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com:4243/runnable/php',
        registry: 'http://registry.runnable.com:4243'
      });
  });
  it('should parse an full image name (w/ port, no tag)', function() {
    imageNameParse('registry.runnable.com:4243/runnable/php')
      .should.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com:4243/runnable/php',
        registry: 'http://registry.runnable.com:4243'
      });
  });
  it('should parse an full image name (no port, w/ tag)', function() {
    imageNameParse('registry.runnable.com/runnable/php:latest')
      .should.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com/runnable/php',
        registry: 'http://registry.runnable.com'
      });
  });
  it('should parse an full image name (no port, no tag)', function() {
    imageNameParse('registry.runnable.com/runnable/php')
      .should.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com/runnable/php',
        registry: 'http://registry.runnable.com'
      });
  });
  it('should parse a short name (w/ tag, namespace)', function() {
    imageNameParse('runnable/php:latest')
      .should.eql({
        name: 'runnable/php',
        fullName: 'runnable/php',
        registry: 'http://index.docker.io'
      });
  });
  it('should parse a short name (no tag, w/ namespace)', function() {
    imageNameParse('runnable/php')
      .should.eql({
        name: 'runnable/php',
        fullName: 'runnable/php',
        registry: 'http://index.docker.io'
      });
  });
  it('should parse a short name (w/ tag)', function() {
    imageNameParse('php:latest')
      .should.eql({
        name: 'php',
        fullName: 'php',
        registry: 'http://index.docker.io'
      });
  });
  it('should parse a short name (no tag)', function() {
    imageNameParse('php')
      .should.eql({
        name: 'php',
        fullName: 'php',
        registry: 'http://index.docker.io'
      });
  });
});
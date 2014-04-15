var Lab = require('lab');
var describe = Lab.experiment;
var it = Lab.test;
var expect = Lab.expect;


var imageNameParse = require('imageNameParse');

describe('imageNameParse', function() {
  it('should parse an full image name (w/ port, tag)', function (done) {
    expect(imageNameParse('localhost:4243/runnable/php:latest'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'localhost:4243/runnable/php',
        registry: 'http://localhost:4243'
      });
    done();
  });
  it('should parse an full image name (w/ port, no tag)', function (done) {
    expect(imageNameParse('localhost:4243/runnable/php'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'localhost:4243/runnable/php',
        registry: 'http://localhost:4243'
      });
    done();
  });
  it('should parse an full image name (no port, w/ tag)', function (done) {
    expect(imageNameParse('localhost/runnable/php:latest'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'localhost/runnable/php',
        registry: 'http://localhost'
      });
    done();
  });
  it('should parse an full image name (no port, no tag)', function (done) {
    expect(imageNameParse('localhost/runnable/php'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'localhost/runnable/php',
        registry: 'http://localhost'
      });
    done();
  });
  it('should parse an full image name (w/ port, tag)', function (done) {
    expect(imageNameParse('registry.runnable.com:4243/runnable/php:latest'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com:4243/runnable/php',
        registry: 'http://registry.runnable.com:4243'
      });
    done();
  });
  it('should parse an full image name (w/ port, no tag)', function (done) {
    expect(imageNameParse('registry.runnable.com:4243/runnable/php'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com:4243/runnable/php',
        registry: 'http://registry.runnable.com:4243'
      });
    done();
  });
  it('should parse an full image name (no port, w/ tag)', function (done) {
    expect(imageNameParse('registry.runnable.com/runnable/php:latest'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com/runnable/php',
        registry: 'http://registry.runnable.com'
      });
    done();
  });
  it('should parse an full image name (no port, no tag)', function (done) {
    expect(imageNameParse('registry.runnable.com/runnable/php'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'registry.runnable.com/runnable/php',
        registry: 'http://registry.runnable.com'
      });
    done();
  });
  it('should parse a short name (w/ tag, namespace)', function (done) {
    expect(imageNameParse('runnable/php:latest'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'runnable/php',
        registry: 'http://index.docker.io'
      });
    done();
  });
  it('should parse a short name (no tag, w/ namespace)', function (done) {
    expect(imageNameParse('runnable/php'))
      .to.eql({
        name: 'runnable/php',
        fullName: 'runnable/php',
        registry: 'http://index.docker.io'
      });
    done();
  });
  it('should parse a short name (w/ tag)', function (done) {
    expect(imageNameParse('php:latest'))
      .to.eql({
        name: 'php',
        fullName: 'php',
        registry: 'http://index.docker.io'
      });
    done();
  });
  it('should parse a short name (no tag)', function (done) {
    expect(imageNameParse('php'))
      .to.eql({
        name: 'php',
        fullName: 'php',
        registry: 'http://index.docker.io'
      });
    done();
  });
});
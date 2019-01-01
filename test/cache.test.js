'use strict';

const {GithubCache} = require('../lib/github-cache.js');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger.js');

describe('Resolver cache', () => {
  describe('locateAppDir()', () => {
    let origHome;
    let origAppData;
    let instance;
    let buildLocation;
    before(() => {
      origHome = process.env.HOME;
      origAppData = process.env.APPDATA;
      process.env.HOME = path.join('a', 'b', 'c');
      buildLocation = path.join('api-console', 'cache');
    });

    after(() => {
      process.env.HOME = origHome;
      process.env.APPDATA = origAppData;
    });

    beforeEach(function() {
      instance = new GithubCache(logger);
    });

    it('Sets cacheFolder property', () => {
      assert.typeOf(instance.cacheFolder, 'string');
    });

    it('cacheFolder property contains sources path', () => {
      const loc = path.join('api-console', 'cache');
      assert.isAbove(instance.cacheFolder.indexOf(loc), 1);
    });

    it('cacheLocation property contains cache file path', () => {
      const loc = path.join('api-console', 'cache', instance.cacheFileName);
      assert.isAbove(instance.cacheLocation.indexOf(loc), 1);
    });

    it('Uses APPDATA variable', () => {
      process.env.APPDATA = path.join('a', 'b', 'c');
      const result = instance.locateAppDir();
      assert.equal(result, path.join(process.env.APPDATA, buildLocation));
      process.env.APPDATA = undefined;
    });

    it('Sets macOS location', () => {
      delete process.env.APPDATA;
      const result = instance.locateAppDir('darwin');
      assert.equal(result, path.join(process.env.HOME, 'Library', 'Preferences', buildLocation));
    });

    it('Sets linux location', () => {
      delete process.env.APPDATA;
      const result = instance.locateAppDir('linux');
      assert.equal(result, path.join(process.env.HOME, '.config', buildLocation));
    });

    it('Uses default location', () => {
      delete process.env.APPDATA;
      const result = instance.locateAppDir('unknown');
      assert.equal(result, path.join('/var/local', buildLocation));
    });
  });

  describe('loadCache()', () => {
    let cache;
    beforeEach(function() {
      cache = new GithubCache(logger);
    });

    before(() => {
      const cache = new GithubCache(logger);
      return fs.remove(cache.cacheFolder)
      .then(() => {
        return fs.outputJson(cache.cacheLocation, {test: true});
      });
    });

    after(() => {
      return fs.remove(cache.cacheFolder);
    });

    it('Reads the cache file', () => {
      return cache.loadCache()
      .then((data) => {
        assert.typeOf(data, 'object');
        assert.deepEqual(data, {test: true});
      });
    });

    it('Success when no logger', () => {
      cache.logger = undefined;
      return cache.loadCache();
    });

    it('Sets _data property', () => {
      return cache.loadCache()
      .then(() => {
        assert.typeOf(cache._data, 'object');
        assert.deepEqual(cache._data, {test: true});
      });
    });

    it('Returns undefined for no cache file', () => {
      return fs.remove(cache.cacheFolder)
      .then(() => cache.loadCache())
      .then((result) => {
        assert.isUndefined(result);
      });
    });
  });

  describe('lastEtag()', () => {
    let cache;
    const url = 'https://test.domain.com';
    const etag = 'test-etag';
    beforeEach(function() {
      cache = new GithubCache(logger);
      const data = {};
      data[url] = {
        etag
      };
      data['test-url'] = {
        response: false
      };
      return fs.outputJson(cache.cacheLocation, data);
    });

    afterEach(() => {
      return fs.remove(cache.cacheFolder);
    });

    it('Returns existing etag', () => {
      return cache.lastEtag(url)
      .then((result) => assert.equal(result, etag));
    });

    it('Returns undefined for non existing url', () => {
      return cache.lastEtag('nothing')
      .then((result) => assert.isUndefined(result));
    });

    it('Returns undefined for missing etag', () => {
      return cache.lastEtag('test-url')
      .then((result) => assert.isUndefined(result));
    });

    it('Returns undefined when no cache file', () => {
      return fs.remove(cache.cacheFolder)
      .then(() => cache.lastEtag('test-url'))
      .then((result) => assert.isUndefined(result));
    });
  });

  describe('_findEtag()', () => {
    let instance;
    beforeEach(function() {
      instance = new GithubCache(logger);
    });

    it('Returns undefined when no argument', () => {
      const result = instance._findEtag(undefined, 'test');
      assert.isUndefined(result);
    });

    it('Returns undefined when url not found', () => {
      const result = instance._findEtag({}, 'test');
      assert.isUndefined(result);
    });

    it('Returns undefined when no etag in entry', () => {
      const result = instance._findEtag({
        test: {}
      }, 'test');
      assert.isUndefined(result);
    });

    it('Returns etag value', () => {
      const result = instance._findEtag({
        test: {
          etag: 'test-etag'
        }
      }, 'test');
      assert.equal(result, 'test-etag');
    });

    it('Returns etag value when no logger', () => {
      instance.logger = undefined;
      const result = instance._findEtag({
        test: {
          etag: 'test-etag'
        }
      }, 'test');
      assert.typeOf(result, 'string');
    });
  });

  describe('_findResponse()', () => {
    let instance;
    beforeEach(function() {
      instance = new GithubCache(logger);
    });

    it('Returns undefined when no data', () => {
      const result = instance._findResponse(undefined, 'test');
      assert.isUndefined(result);
    });

    it('Returns undefined when url not found', () => {
      const result = instance._findResponse({}, 'test');
      assert.isUndefined(result);
    });

    it('Returns undefined when no response in entry', () => {
      const result = instance._findResponse({
        test: {}
      }, 'test');
      assert.isUndefined(result);
    });

    it('Returns undefined when no response in entry and no logger', () => {
      instance.logger = undefined;
      const result = instance._findResponse({
        test: {}
      }, 'test');
      assert.isUndefined(result);
    });

    it('Returns response value', () => {
      const result = instance._findResponse({
        test: {
          response: 'test-response'
        }
      }, 'test');
      assert.equal(result, 'test-response');
    });

    it('Returns etag value when no logger', () => {
      instance.logger = undefined;
      const result = instance._findResponse({
        test: {
          response: 'test-response'
        }
      }, 'test');
      assert.typeOf(result, 'string');
    });
  });

  describe('getCachedResult()', () => {
    let cache;
    const url = 'https://test.domain.com';
    const response = 'test-response';
    beforeEach(function() {
      cache = new GithubCache(logger);
      const data = {};
      data[url] = {
        response
      };
      data['test-url'] = {
        response: null // so it will be serialized
      };
      return fs.outputJson(cache.cacheLocation, data);
    });

    afterEach(() => {
      return fs.remove(cache.cacheFolder);
    });

    it('Returns existing response', () => {
      return cache.getCachedResult(url)
      .then((result) => assert.equal(result, response));
    });

    it('Returns undefined for non existing url', () => {
      return cache.getCachedResult('nothing')
      .then((result) => assert.isUndefined(result));
    });

    it('Returns undefined for missing response', () => {
      return cache.getCachedResult('test-url')
      .then((result) => assert.isUndefined(result));
    });

    it('Returns undefined when no cache file', () => {
      return fs.remove(cache.cacheFolder)
      .then(() => cache.getCachedResult('test-url'))
      .then((result) => assert.isUndefined(result));
    });
  });

  describe('storeResponse()', () => {
    let cache;
    const url = 'https://test.domain.com';
    const etag = 'test-etag';
    before(() => {
      const cache = new GithubCache(logger);
      return fs.remove(cache.cacheFolder);
    });
    beforeEach(function() {
      cache = new GithubCache(logger);
    });
    afterEach(() => {
      return fs.remove(cache.cacheFolder);
    });

    it('Stores the response data', () => {
      return cache.storeResponse(url, etag, {
        test: 'response'
      })
      .then(() => fs.readJson(cache.cacheLocation))
      .then((result) => {
        assert.typeOf(result, 'object', 'Function call result is an object');
        const data = result[url];
        assert.typeOf(data, 'object', 'URL related data is an object');
        assert.equal(data.etag, etag);
        assert.equal(data.response.test, 'response');
      });
    });
  });
});

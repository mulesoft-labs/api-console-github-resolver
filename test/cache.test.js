'use strict';

const {GithubCache} = require('../lib/github-cache.js');
const assert = require('chai').assert;
const fs = require('fs-extra');
const path = require('path');

describe('Resolver cache', () => {
  describe('locateAppDir()', () => {
    let cache;
    before(function() {
      cache = new GithubCache();
    });

    it('Sets cacheFolder property', () => {
      assert.typeOf(cache.cacheFolder, 'string');
    });

    it('cacheFolder property contains sources path', () => {
      const loc = path.join('api-console', 'cache');
      assert.isAbove(cache.cacheFolder.indexOf(loc), 1);
    });

    it('cacheLocation property contains cache file path', () => {
      const loc = path.join('api-console', 'cache', cache.cacheFileName);
      assert.isAbove(cache.cacheLocation.indexOf(loc), 1);
    });
  });

  describe('loadCache()', () => {
    let cache;
    beforeEach(function() {
      cache = new GithubCache();
    });

    before(() => {
      const cache = new GithubCache();
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
      cache = new GithubCache();
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

  describe('getCachedResult()', () => {
    let cache;
    const url = 'https://test.domain.com';
    const response = 'test-response';
    beforeEach(function() {
      cache = new GithubCache();
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
      const cache = new GithubCache();
      return fs.remove(cache.cacheFolder);
    });
    beforeEach(function() {
      cache = new GithubCache();
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

'use strict';

const {GithubResolver} = require('../lib/github-resolver.js');
const {GithubResolverOptions} = require('../lib/github-resolver-options.js');
const assert = require('chai').assert;
const fs = require('fs-extra');

function getResolverOptions(minimumTagMajor) {
  const token = process.env.GITHUB_TOKEN;
  return new GithubResolverOptions({
    token: token,
    minimumTagMajor: minimumTagMajor
  });
}

// jscs:disable
describe('GitHub resolver', () => {
  describe('basics', () => {
    let resolver;
    before(function() {
      resolver = new GithubResolver(getResolverOptions());
    });

    it('_getResetTime() returns -1', function() {
      assert.equal(resolver._getResetTime(), -1);
    });

    it('_assertCanMakeRequest() do not throws error', function() {
      resolver._assertCanMakeRequest();
    });
  });

  describe('_assertTag()', () => {
    let resolver;
    before(function() {
      resolver = new GithubResolver(getResolverOptions());
    });

    it('do not throws error for 5.0.0', function() {
      resolver._assertTag('5.0.0');
    });

    it('do not throws error for 5.1.0', function() {
      resolver._assertTag('5.1.0');
    });

    it('do not throws error for 5.1.1', function() {
      resolver._assertTag('5.1.1');
    });

    it('do not throws error for v5.0.1', function() {
      resolver._assertTag('v5.0.1');
    });

    it('throws for version lower than 5.0.0', function() {
      assert.throws(function() {
        resolver._assertTag('4.0.0');
      });
    });

    it('throws for version lower than v5.0.0', function() {
      assert.throws(function() {
        resolver._assertTag('v4.0.0');
      });
    });
  });

  describe('_filterSupportedTags()', () => {
    const list = [{
      tag_name: '2.0.0'
    }, {
      tag_name: 'v2.0.0'
    }, {
      tag_name: '3.1.0-alpha'
    }, {
      tag_name: 'v4.0.0'
    }, {
      tag_name: '4.1.0'
    }, {
      tag_name: 'v4.0.1-test'
    }, {
      tag_name: 'v4.0.2-alpha',
      prerelease: true
    }, {
      tag_name: 'v4.2.0'
    }];

    let resolver;
    before(function() {
      resolver = new GithubResolver(getResolverOptions());
    });

    it('Should filter preleases', function() {
      const result = resolver._filterSupportedTags(list);
      const item = result.find((item) => item.prerelease);
      assert.notOk(item);
    });

    it('Should filter out versions lower than major 4', function() {
      const result = resolver._filterSupportedTags(list);
      const item = result.find((item) => (item.tag_name.indexOf('v2') !== -1 &&
        item.tag_name.indexOf('v3') !== -1 &&
        item.tag_name.indexOf('v3') !== -1 && item.tag_name.indexOf('3') !== -1));
      assert.notOk(item);
    });
  });

  describe('_sortTags()', () => {
    const list = [{
      tag_name: '2.0.0'
    }, {
      tag_name: 'v2.0.1'
    }, {
      tag_name: '3.1.0-alpha'
    }, {
      tag_name: 'v4.0.0'
    }, {
      tag_name: '4.1.0'
    }, {
      tag_name: 'v4.0.1-test'
    }, {
      tag_name: 'v4.0.2-alpha',
      prerelease: true
    }, {
      tag_name: 'v4.2.0'
    }];

    let resolver;
    before(function() {
      resolver = new GithubResolver(getResolverOptions());
    });

    it('Should sort tags', function() {
      list.sort(resolver._sortTags.bind(resolver));
      assert.equal(list[0].tag_name, 'v4.2.0');
      assert.equal(list[1].tag_name, '4.1.0');
      assert.equal(list[2].tag_name, 'v4.0.2-alpha');
      assert.equal(list[3].tag_name, 'v4.0.1-test');
      assert.equal(list[4].tag_name, 'v4.0.0');
      assert.equal(list[5].tag_name, '3.1.0-alpha');
      assert.equal(list[6].tag_name, 'v2.0.1');
      assert.equal(list[7].tag_name, '2.0.0');
    });
  });

  describe('getLatestInfo()', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(4));
      return resolver.getLatestInfo()
      .then((res) => {
        response = res;
      })
      .catch((cause) => {
        console.log(cause.message);
        throw cause;
      });
    });

    it('Response is an object', function() {
      assert.typeOf(response, 'object');
    });

    it('Contains zipball_url', function() {
      // jscs: disable
      assert.ok(response.zipball_url);
      // jscs: enable
    });

    it('Contains tag_name', function() {
      // jscs: disable
      assert.ok(response.tag_name);
      // jscs: enable
    });
  });

  describe('getReleasesList()', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(4));
      return resolver.getReleasesList()
      .then((res) => {
        response = res;
      });
    });

    it('Response is an array', function() {
      assert.typeOf(response, 'array');
    });

    it('Response array is not empty', function() {
      assert.isAbove(response.length, 1);
    });

    it('Entry contains zipball_url', function() {
      // jscs: disable
      assert.ok(response[0].zipball_url);
      // jscs: enable
    });

    it('Entry contains tag_name', function() {
      // jscs: disable
      assert.ok(response[0].tag_name);
      // jscs: enable
    });

    it('Adds entry in cache file', () => {
      const cacheFile = resolver._cache.cacheLocation;
      return fs.readJson(cacheFile)
      .then((data) => {
        const releaseUrl = 'https://api.github.com/repos/mulesoft/api-console/releases';
        const result = data[releaseUrl];
        assert.typeOf(result.etag, 'string');
        assert.typeOf(result.response, 'array');
      });
    });
  });

  describe('getTagInfo()', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(4));
      return resolver.getTagInfo('v4.0.0')
      .then((res) => {
        response = res;
      });
    });

    it('Response is an object', function() {
      assert.typeOf(response, 'object');
    });

    it('Contains zipball_url', function() {
      // jscs: disable
      assert.ok(response.zipball_url);
      // jscs: enable
    });

    it('Contains tag_name', function() {
      // jscs: disable
      assert.ok(response.tag_name);
      // jscs: enable
    });

    it('Adds entry in cache file', () => {
      const cacheFile = resolver._cache.cacheLocation;
      return fs.readJson(cacheFile)
      .then((data) => {
        const releaseUrl = 'https://api.github.com/repos/mulesoft/api-console/releases/tags/v4.0.0';
        const result = data[releaseUrl];
        assert.typeOf(result.etag, 'string');
        assert.typeOf(result.response, 'object');
      });
    });
  });

  describe('getTagInfo() error', () => {
    let resolver;
    before(function() {
      resolver = new GithubResolver(getResolverOptions());
    });

    it('Will throw an error for tags below 4.0.0', function() {
      return resolver.getTagInfo('v3.0.0')
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        if (cause.message === 'TEST') {
          throw new Error('Passed invalid tag');
        }
      });
    });

    it('Will throw an error for non existing tags', function() {
      return resolver.getTagInfo('152.22.9820')
      .then(() => {
        throw new Error('TEST');
      })
      .catch((cause) => {
        if (cause.message === 'TEST') {
          throw new Error('Passed invalid tag');
        }
      });
    });
  });

});

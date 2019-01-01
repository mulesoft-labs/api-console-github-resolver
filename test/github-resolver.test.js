'use strict';

const {GithubResolver} = require('../lib/github-resolver.js');
const {GithubResolverOptions} = require('../lib/github-resolver-options.js');
const assert = require('chai').assert;
const logger = require('./logger.js');
const fs = require('fs-extra');

function getResolverOptions(minimumTagMajor, maximumTagMajor) {
  const token = process.env.GITHUB_TOKEN;
  return new GithubResolverOptions({
    token: token,
    minimumTagMajor,
    maximumTagMajor
  });
}


// jscs:disable
describe('GitHub resolver', () => {
  describe('constructor()', () => {
    it('Accepts options as object', () => {
      const instance = new GithubResolver({
        minimumTagMajor: '4.0.0',
        maximumTagMajor: '5.0.0'
      });
      assert.isTrue(instance.opts instanceof GithubResolverOptions);
    });

    it('Sets default logger', () => {
      const instance = new GithubResolver(getResolverOptions());
      assert.typeOf(instance.logger, 'object');
    });

    it('Sets passed logger', () => {
      const instance = new GithubResolver({
        logger
      });
      assert.isTrue(instance.logger === logger);
    });

    it('Sets rateLimitRemaining', () => {
      const instance = new GithubResolver({});
      assert.equal(instance.rateLimitRemaining, -1);
    });

    it('Sets resetTime', () => {
      const instance = new GithubResolver({});
      assert.equal(instance.resetTime, -1);
    });

    it('Sets _githubReleasesUrl', () => {
      const instance = new GithubResolver({});
      assert.equal(instance._githubReleasesUrl, 'https://api.github.com/repos/mulesoft/api-console/releases');
    });

    it('Sets _lagReleaseUrl', () => {
      const instance = new GithubResolver({});
      assert.equal(instance._lagReleaseUrl, 'https://api.github.com/repos/mulesoft/api-console/releases/tags/%s');
    });

    it('Creates instance of Transport', () => {
      const instance = new GithubResolver({});
      assert.typeOf(instance._transport, 'object');
    });

    it('Sets _infoHeaders', () => {
      const instance = new GithubResolver({});
      assert.typeOf(instance._infoHeaders, 'object');
    });

    it('Creates instance of GithubCache', () => {
      const instance = new GithubResolver({});
      assert.typeOf(instance._cache, 'object');
    });
  });

  describe('_setupLogger()', () => {
    let instance;
    beforeEach(() => {
      instance = new GithubResolver({});
    });

    it('Creates default logger', () => {
      const result = instance._setupLogger({});
      assert.typeOf(result, 'object');
    });

    it('Creates default logger', () => {
      const result = instance._setupLogger({
        logger
      });
      assert.isTrue(result === logger);
    });

    it('Sets debug level', () => {
      const result = instance._setupLogger({
        verbose: true
      });
      assert.equal(result.level, 'debug');
    });
  });

  describe('_computeHeaders()', () => {
    let instance;
    beforeEach(() => {
      instance = new GithubResolver({});
    });

    it('Returns an object', () => {
      const result = instance._computeHeaders();
      assert.typeOf(result, 'object');
    });

    it('Has "user-agent" entry', () => {
      const result = instance._computeHeaders();
      assert.equal(result['user-agent'], 'mulesoft-labs/api-console-github-resolver');
    });

    it('Has "accept" entry', () => {
      const result = instance._computeHeaders();
      assert.equal(result.accept, 'application/vnd.github.loki-preview+json');
    });

    it('Has "authorization" entry', () => {
      const token = 'test-token';
      instance.opts.token = token;
      const result = instance._computeHeaders();
      assert.equal(result.authorization, 'token ' + token);
    });
  });

  describe('_getResetTime()', () => {
    let instance;
    beforeEach(() => {
      instance = new GithubResolver({});
    });

    it('Returns -1 when default this.resetTime', () => {
      instance.resetTime = -1;
      const result = instance._getResetTime();
      assert.equal(result, -1);
    });

    it('Returns positive number when set', () => {
      instance.resetTime = Date.now() + 10005;
      const result = instance._getResetTime();
      assert.isAbove(result, -0);
    });
  });

  describe('_assertCanMakeRequest()', () => {
    let instance;
    beforeEach(() => {
      instance = new GithubResolver({});
    });

    it('Will not throw when rateLimitRemaining is -1', () => {
      instance.rateLimitRemaining = -1;
      instance._assertCanMakeRequest();
    });

    it('Will not throw when rateLimitRemaining is positive number', () => {
      instance.rateLimitRemaining = 1;
      instance._assertCanMakeRequest();
    });

    it('Throws when limit i 0', () => {
      instance.rateLimitRemaining = 0;
      assert.throws(() => {
        instance._assertCanMakeRequest();
      });
    });

    it('Throws message for undefined time limit', () => {
      instance.rateLimitRemaining = 0;
      instance.resetTime = -1;
      assert.throws(() => {
        instance._assertCanMakeRequest();
      }, 'You have used GitHub limit for this hour. Try again soon.');
    });

    it('Throws message for defined time limit', () => {
      instance.rateLimitRemaining = 0;
      instance.resetTime = Date.now() + 10005;
      assert.throws(() => {
        instance._assertCanMakeRequest();
      }, /You have used GitHub limit for this hour. Your limit resets in \d+ seconds./im);
    });
  });

  describe('_assertTag() - default', () => {
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

    it('Default minimum version is 5', function() {
      resolver.opts.maximumTagMajor = 5;
      assert.throws(function() {
        resolver._assertTag('v4.0.0');
      });
    });

    it('throws for major version higher than 5', function() {
      resolver.opts.minimumTagMajor = undefined;
      assert.throws(function() {
        resolver._assertTag('4.0.0');
      });
    });

    it('throws for major version higher than v5', function() {
      resolver.opts.maximumTagMajor = 5;
      assert.throws(function() {
        resolver._assertTag('v6.0.0');
      });
    });

    it('throws when major version is not valid', function() {
      assert.throws(function() {
        resolver._assertTag('something5.0.0');
      });
    });
  });

  describe('_assertTag() - with minimumTagMajor', () => {
    let resolver;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(4));
    });

    it('do not throws error for 4.0.0', function() {
      resolver._assertTag('4.0.0');
    });

    it('do not throws error for 4.1.0', function() {
      resolver._assertTag('4.1.0');
    });

    it('do not throws error for 4.1.1', function() {
      resolver._assertTag('4.1.1');
    });

    it('do not throws error for v4.0.1', function() {
      resolver._assertTag('v4.0.1');
    });

    it('throws for version lower than 3.0.0', function() {
      assert.throws(function() {
        resolver._assertTag('3.0.0');
      });
    });

    it('throws for version lower than v3.0.0', function() {
      assert.throws(function() {
        resolver._assertTag('v3.0.0');
      });
    });
  });

  describe('_filterSupportedTags() - default', () => {
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

    it('Should filter out versions lower than major 5', function() {
      const result = resolver._filterSupportedTags(list);
      const item = result.find((item) => (item.tag_name.indexOf('v2') !== -1 ||
        item.tag_name.indexOf('v3') !== -1 ||
        item.tag_name.indexOf('v3') !== -1 ||
        item.tag_name.indexOf('3') !== -1 ||
        item.tag_name.indexOf('4') !== -1 ||
        item.tag_name.indexOf('v4') !== -1));
      assert.notOk(item);
    });
  });

  describe('_filterSupportedTags() - version 4', () => {
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
      resolver = new GithubResolver(getResolverOptions(4));
    });

    it('Should filter preleases', function() {
      const result = resolver._filterSupportedTags(list);
      const item = result.find((item) => item.prerelease);
      assert.notOk(item);
    });

    it('Should filter out versions lower than major 4', function() {
      const result = resolver._filterSupportedTags(list);
      const item = result.find((item) => (item.tag_name.indexOf('v2') !== -1 ||
        item.tag_name.indexOf('v3') !== -1 ||
        item.tag_name.indexOf('v3') !== -1 || item.tag_name.indexOf('3') !== -1));
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

    it('Returns 1 when a major is smaller than b major', () => {
      const result = resolver._sortTags({tag_name: '1.0.0'}, {tag_name: '2.0.0'});
      assert.equal(result, 1);
    });

    it('Returns -1 when b major is smaller than a major', () => {
      const result = resolver._sortTags({tag_name: '2.0.0'}, {tag_name: '1.0.0'});
      assert.equal(result, -1);
    });

    it('Returns 1 when a minor is smaller than b minor', () => {
      const result = resolver._sortTags({tag_name: '1.1.0'}, {tag_name: '1.2.0'});
      assert.equal(result, 1);
    });

    it('Returns -1 when b minor is smaller than a minor', () => {
      const result = resolver._sortTags({tag_name: '1.2.0'}, {tag_name: '1.1.0'});
      assert.equal(result, -1);
    });

    it('Returns 1 when a patch is smaller than b patch', () => {
      const result = resolver._sortTags({tag_name: '1.0.1'}, {tag_name: '1.0.2'});
      assert.equal(result, 1);
    });

    it('Returns -1 when b patch is smaller than a patch', () => {
      const result = resolver._sortTags({tag_name: '1.0.2'}, {tag_name: '1.0.1'});
      assert.equal(result, -1);
    });

    it('Returns 0 version match', () => {
      const result = resolver._sortTags({tag_name: '1.0.0'}, {tag_name: '1.0.0'});
      assert.equal(result, 0);
    });

    it('Returns 0 version match with v prefix', () => {
      const result = resolver._sortTags({tag_name: 'v1.0.0'}, {tag_name: '1.0.0'});
      assert.equal(result, 0);
    });
  });

  describe('getLatestInfo() - version 4', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(4, 4));
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
      let tag = response.tag_name;
      // jscs: enable
      assert.ok(tag);
      if (tag[0] === 'v') {
        tag = tag.substr(1);
      }
      assert.equal(tag[0], '4');
    });
  });

  // Until firsxt stable release this tests won't work
  describe.skip('getLatestInfo() - version 5', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(5, 5));
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
      let tag = response.tag_name;
      // jscs: enable
      assert.ok(tag);
      if (tag[0] === 'v') {
        tag = tag.substr(1);
      }
      assert.equal(tag[0], '5');
    });
  });

  describe('getReleasesList() - version 4', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(4, 4));
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

    it('Contains version 4 only', function() {
      const item = response.find((item) => {
        let tag = item.tag_name;
        if (tag[0] === 'v') {
          tag = tag.substr(1);
        }
        if (tag[0] !== '4') {
          return true;
        }
        return false;
      });
      assert.isUndefined(item);
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

  // Until firsxt stable release this tests won't work
  describe.skip('getReleasesList() - version 5', () => {
    let resolver;
    let response;
    before(function() {
      resolver = new GithubResolver(getResolverOptions(5, 5));
      return resolver.getReleasesList()
      .then((res) => {
        response = res;
      });
    });

    it('Response is an array', function() {
      assert.typeOf(response, 'array');
    });

    it('Response array is not empty', function() {
      assert.isAbove(response.length, 0);
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

    it('Contains version 5 only', function() {
      const item = response.find((item) => {
        let tag = item.tag_name;
        if (tag[0] === 'v') {
          tag = tag.substr(1);
        }
        if (tag[0] !== '5') {
          return true;
        }
        return false;
      });
      assert.isUndefined(item);
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

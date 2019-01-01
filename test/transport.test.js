'use strict';

const {Transport} = require('../lib/transport.js');
const assert = require('chai').assert;
const logger = require('./logger.js');

function getHeaders(extra) {
  const token = process.env.GITHUB_TOKEN;
  let headers = {
    'user-agent': 'mulesoft-labs/api-console-github-resolver'
  };
  if (token) {
    headers.authorization = 'token ' + token;
  }
  if (extra) {
    headers = Object.assign(headers, extra);
  }
  return headers;
}

describe('Transport library', () => {
  describe('_optionsForUrl()', () => {
    let instance;
    before(function() {
      instance = new Transport(logger);
    });

    it('Returns an object', () => {
      const result = instance._optionsForUrl('https://domain.com');
      assert.typeOf(result, 'object');
    });

    it('Returns host name', () => {
      const result = instance._optionsForUrl('https://domain.com');
      assert.equal(result.hostname, 'domain.com');
    });

    it('Returns path value', () => {
      const result = instance._optionsForUrl('https://domain.com/a/b/c');
      assert.equal(result.path, '/a/b/c');
    });

    it('Returns headers if set', () => {
      const headers = {};
      const result = instance._optionsForUrl('https://domain.com/', headers);
      assert.isTrue(result.headers === headers);
    });

    it('Headers are undefined when not set', () => {
      const result = instance._optionsForUrl('https://domain.com/');
      assert.isUndefined(result.headers);
    });
  });

  describe('_processResponse()', () => {
    let instance;
    before(function() {
      instance = new Transport(logger);
    });

    it('Returns undefined if no argument', () => {
      const result = instance._processResponse();
      assert.isUndefined(result);
    });

    it('Returns unchanged response when no content type', () => {
      instance.latestHeaders = {};
      const result = instance._processResponse('test');
      assert.equal(result, 'test');
    });

    it('Parses JSON response', () => {
      instance.latestHeaders = {
        'content-type': 'application/json'
      };
      const result = instance._processResponse('{"test": true}');
      assert.deepEqual(result, {'test': true});
    });

    it('Throws when response is invalid', () => {
      instance.latestHeaders = {
        'content-type': 'application/json'
      };
      assert.throws(() => {
        instance._processResponse('{test: true}');
      });
    });

    it('Returns unchanged response for other media types', () => {
      instance.latestHeaders = {
        'content-type': 'application/xml'
      };
      const result = instance._processResponse('test');
      assert.equal(result, 'test');
    });
  });

  describe('get() JSON', () => {
    const jsonUrl = 'https://api.github.com/repos/mulesoft/api-console/releases';
    const headers = getHeaders({
      'accept': 'application/vnd.github.loki-preview+json'
    });
    let transport;
    let json;

    before(function() {
      transport = new Transport(logger);
      return transport.get(jsonUrl, headers)
      .then((response) => {
        json = response;
      });
    });

    it('Response should be a JS object', function() {
      assert.typeOf(json, 'array');
    });

    it('Response should no be empty', function() {
      assert.isAbove(json.length, 1);
    });

    it('Transport has latest headers', function() {
      assert.typeOf(transport.latestHeaders, 'object');
    });
  });

  describe('get() Buffer', () => {
    const zipUrl = 'https://api.github.com/repos/mulesoft/api-console/zipball/v4.0.0';
    const headers = getHeaders();
    let transport;
    let response;

    before(function() {
      this.timeout(20000);
      transport = new Transport(logger);
      return transport.get(zipUrl, headers)
      .then((res) => {
        response = res;
      });
    });

    it('Response should be a Buffer', function() {
      assert.ok(response.buffer);
    });

    it('Response should no be empty', function() {
      assert.isAbove(response.length, 1);
    });
  });
});

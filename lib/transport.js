'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc <pawel.psztyc@mulesoft.com>
 */

const https = require('https');
const url = require('url');
/**
 * A GitGub transport class.
 * The transport is based on the HTTPS protocol.
 */
class Transport {
  /**
   * @param {Object} logger A logger object to use to log messages.
   */
  constructor(logger) {
    /**
     * Latest received headers from the server.
     *
     * @type {Object}
     */
    this.latestHeaders = {};
    /**
     * Latest response status code.
     *
     * @type {Number}
     */
    this.latestStatus = -1;
    this.logger = logger;
  }
  /**
   * Gets a resource from given location.
   * This function fallows redirections.
   *
   * @param {String} resource URL to the resource.
   * @param {Object} headers A list of headers to send.
   * @return {Promise} A promise resolved to a JavaScript object if detected
   * comatible content type or to Buffer object otherwise.
   */
  get(resource, headers) {
    return this._get(resource, headers)
    .then((result) => this._processResponse(result));
  }
  /**
   * Creates a HTTP options for the Request object.
   * @param {String} resource URL to the resource.
   * @param {Object} headers A list of headers to send.
   * @return {Object} List of options to be passed to the Request.
   */
  _optionsForUrl(resource, headers) {
    const _url = url.parse(resource);
    return {
      hostname: _url.hostname,
      path: _url.pathname + (_url.search ? _url.search : ''),
      headers: headers ? headers : undefined
    };
  }
  /**
   * Implementation of transport for `get()` method.
   *
   * @param {String} resource URL to the resource.
   * @param {Object} headers A list of headers to send.
   * @return {Promise} A promise resolved to a JavaScript object if detected
   * comatible content type or to Buffer object otherwise.
   */
  _get(resource, headers) {
    this.logger.debug('[Transport] Issuing GET request...');
    let opts;
    try {
      opts = this._optionsForUrl(resource, headers);
    } catch (e) {
      return Promise.reject(e);
    }

    return new Promise((resolve, reject) => {
      https.get(opts, (res) => {
        this.latestHeaders = res.headers;
        this.latestStatus = res.statusCode;
        this.logger.debug('[Transport] Received response with status code ' + res.statusCode);
        if (res.statusCode === 304) {
          res.destroy();
          return resolve();
        }

        if (res.statusCode >= 300 && res.statusCode < 400) {
          const location = this.latestHeaders.location;
          if (!location) {
            reject(new Error('Invalid redirect. No location header.'));
            return;
          }
          res.resume();
          return resolve(this._get(location, headers));
        }

        if (res.statusCode < 200 && res.statusCode >= 300) {
          this.logger.error('[Transport] Response error. Received headers:', this.latestHeaders);
          reject(new Error(
            'Resource unavailable. Response code: ', res.statusCode));
          return;
        }

        let rawData;
        res.on('data', (chunk) => {
          if (!rawData) {
            rawData = chunk;
          } else {
            rawData = Buffer.concat([rawData, chunk]);
          }
        });

        res.on('end', () => {
          this.logger.debug('[Transport] Response received.');
          resolve(rawData);
        });
      })
      .on('error', (e) => {
        console.error(e);
        reject(new Error(e.message));
      });
    });
  }
  /**
   * Proecesses the response. If the response is of a type of
   * application/json then it will return
   * a JavaScript object parsed from the response. Otherwise it returns
   * a buffer.
   *
   * @param {object} response An object returned from transport function with
   * `buffer` and `header` properties
   * @return {Object|Buffer} Either object if the response is a JSON object or
   * buffer otherwise.
   */
  _processResponse(response) {
    if (!response) {
      return response;
    }
    this.logger.debug('[Transport] Processing response...');
    const ct = this.latestHeaders['content-type'];
    if (!ct) {
      this.logger.warn('[Transport] No content type header received. Quitting.');
      return response;
    }
    if (~ct.indexOf('application/json')) {
      this.logger.debug('[Transport] Parsing response as JSON.');
      try {
        return JSON.parse(response.toString('utf8'));
      } catch (e) {
        this.logger.error('[Transport] Unable to parse response data as JSON.');
        throw e;
      }
    }
    this.logger.debug('[Transport] Done.');
    return response;
  }
}
exports.Transport = Transport;

const path = require('path');
const fs = require('fs-extra');
/**
 * A class responsible for caching and restoring cached GitHub responses
 * results.
 *
 * Unauthenticated requests to GitHub has 60 requests per hour limit.
 * This class helps to cache the results so it's a lower risk of receiving
 * `403 Forbidden` error.
 *
 * This class works with the resolver class.
 *
 * The class stores data in user's home data folder in
 * `api-console/cache/github-http-cache.json` folder.
 */
class GithubCache {
  /**
   * @constructor
   */
  constructor() {
    this.cacheFolder = this.locateAppDir();
    this.cacheFileName = 'github-http-cache.json';
    this.cacheLocation = path.join(this.cacheFolder, this.cacheFileName);
  }
  /**
   * Creates a path to cache folder under user data folder.
   *
   * @return {String}
   */
  locateAppDir() {
    let dir;
    if (process.env.APPDATA) {
      dir = process.env.APPDATA;
    } else if (process.platform === 'darwin') {
      dir = process.env.HOME + '/Library/Preferences';
    } else if (process.platform === 'linux') {
      dir = process.env.HOME + '/.config';
    } else {
      dir = '/var/local';
    }
    dir = path.join(dir, 'api-console', 'cache');
    return dir;
  }
  /**
   * Loads cache data into memory and returns the data.
   * @return {Promise} Promise resolved to cache file contents.
   */
  loadCache() {
    if (this._data) {
      return Promise.resolve(this._data);
    }
    return fs.ensureFile(this.cacheLocation)
    .then(() => fs.readJson(this.cacheLocation, {throws: false}))
    .then((data) => {
      if (data === null) {
        data = undefined;
      }
      this._data = data;
      return data;
    });
  }
  /**
   * Restores latest `etag`
   *
   * @param {String} url The full URL used to cache the results.
   * @return {Promise}
   */
  lastEtag(url) {
    return this.loadCache()
    .then((data) => this._findEtag(data, url));
  }
  /**
   * Finds etag in cached data.
   * @param {Object} data Cached data
   * @param {String} url URL to used to cache the data
   * @return {String|undefined} Entry etag.
   */
  _findEtag(data, url) {
    if (!data || !(url in data)) {
      return;
    }
    const entry = data[url];
    if (!entry || !entry.etag) {
      return;
    }
    return entry.etag;
  }
  /**
   * Reads response data from cached data.
   * @param {String} url The full URL used to cache the results.
   * @return {Promise}
   */
  getCachedResult(url) {
    return this.loadCache()
    .then((data) => this._findResponse(data, url));
  }
  /**
   * Finds response in cached data.
   * @param {Object} data Cached data
   * @param {String} url URL to used to cache the data
   * @return {String|undefined} Entry etag.
   */
  _findResponse(data, url) {
    if (!data) {
      return;
    }
    const entry = data[url];
    if (!entry || !entry.response) {
      return;
    }
    return entry.response;
  }
  /**
   * Adds response data to the cache store.
   *
   * @param {String} url Request full URL. Used as a key in the store.
   * @param {String} etag Response etag
   * @param {Object} response Response data to cache
   * @return {Promise}
   */
  storeResponse(url, etag, response) {
    return this.loadCache()
    .then((data) => this._addCacheEntry(data, url, etag, response));
  }
  /**
   * Appends response data to the cache.
   *
   * @param {Obect} data Responses cache object
   * @param {String} url Request URL
   * @param {String} etag Response etag
   * @param {Object} response GitHub response.
   * @return {Promise}
   */
  _addCacheEntry(data, url, etag, response) {
    if (!data) {
      data = {};
    }
    data[url] = {
      etag,
      response
    };
    this._data = data;
    return this._store();
  }
  /**
   * Stores current data to the cache file.
   * @return {Promise}
   */
  _store() {
    const data = this._data || {};
    return fs.writeJson(this.cacheLocation, data);
  }
}
exports.GithubCache = GithubCache;

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
   * @param {Object} logger A logger object to use to log messages.
   */
  constructor(logger) {
    this.cacheFolder = this.locateAppDir();
    this.cacheFileName = 'github-http-cache.json';
    this.cacheLocation = path.join(this.cacheFolder, this.cacheFileName);
    this.logger = logger;
  }
  /**
   * Creates a path to cache folder under user data folder.
   *
   * @param {?String} platform Current platform. If not set `process.platform`
   * is used.
   * @return {String}
   */
  locateAppDir(platform) {
    let dir;
    if (!platform) {
      platform = process.platform;
    }
    if (typeof process.env.APPDATA !== 'undefined' && process.env.APPDATA && process.env.APPDATA !== 'undefined') {
      dir = process.env.APPDATA;
    } else if (platform === 'darwin') {
      dir = process.env.HOME + '/Library/Preferences';
    } else if (platform === 'linux') {
      dir = process.env.HOME + '/.config';
    } else {
      dir = '/var/local';
    }
    dir = path.join(dir, 'api-console', 'cache');
    if (this.logger) {
      this.logger.debug('[GithubCache] Cache dire is ' + dir);
    }
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
    if (this.logger) {
      this.logger.debug('[GithubCache] Loading cache from ' + this.cacheLocation);
    }
    return fs.ensureFile(this.cacheLocation)
    .then(() => fs.readJson(this.cacheLocation, {throws: false}))
    .then((data) => {
      if (data === null) {
        data = undefined;
        if (this.logger) {
          this.logger.debug('[GithubCache] Cache file does not exists.');
        }
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
    if (this.logger) {
      this.logger.debug('[GithubCache] Looking for an etag for ' + url);
    }
    const entry = data[url];
    if (!entry || !entry.etag) {
      return;
    }
    if (this.logger) {
      this.logger.debug('[GithubCache] Found etag: ' + entry.etag);
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
    if (this.logger) {
      this.logger.debug('[GithubCache] Looking for cached response for ' + url);
    }
    const entry = data[url];
    if (!entry || !entry.response) {
      if (this.logger) {
        this.logger.debug('[GithubCache] Cached response does not exist.');
      }
      return;
    }
    if (this.logger) {
      this.logger.debug('[GithubCache] Cached response exists.');
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
    if (this.logger) {
      this.logger.debug('[GithubCache] Adding cache entry for ' + url);
    }
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
    if (this.logger) {
      this.logger.debug('[GithubCache] Storing cache data to ' + this.cacheLocation);
    }
    return fs.writeJson(this.cacheLocation, data);
  }
}
exports.GithubCache = GithubCache;

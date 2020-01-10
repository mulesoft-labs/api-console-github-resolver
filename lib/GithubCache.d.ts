// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

export {GithubCache};

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
declare class GithubCache {
  constructor(logger: Object);
  locateAppDir(platform?: String): String;
  loadCache(): Promise<Object>;
  lastEtag(url: String): Promise<String|undefined>;
  getCachedResult(url: String): Promise<String|undefined>;
  storeResponse(url: String, etag: String, response: Object): Promise<void>;
  _findEtag(data: Object, url: String): String|undefined;
  _findResponse(data: Object, url: String): String|undefined;
  _addCacheEntry(data: Object, url: String, etag: String, response: Object): Promise<void>;
  _store(): Promise<void>;
}

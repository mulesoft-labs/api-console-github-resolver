// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

export {GithubResolver};

import { GithubResolverOptions } from './GithubResolverOptions.js';

/**
 * A GitGub transport class.
 * The transport is based on the HTTPS protocol.
 */
declare class GithubResolver {
  constructor(opts?: GithubResolverOptions);
  getLatestInfo(): Promise<Object>;
  getReleasesList(): Promise<Array<Object>>;
  getTagInfo(): Promise<Object>;
  _setupLogger(opts?: GithubResolverOptions): Object;
  _computeHeaders(): Object;
  _getResetTime(): number;
  _assertCanMakeRequest(): void;
  _makeRequest(url: String, headers?: Object): Promise<Object|Buffer>;
  _handleResponseHeaders(): void;
  _filterSupportedTags(json: Array<Object>): Array<Object>;
  _sortTags(a: string, b: string): number;
  _getTagInfo(tag: string): Object;
  _throwTag404Error(tag: string): void;
  _getReleasesListErrorMessage(tag: string, releases: Array<Object>): string;
  _assertTag(tag: string): void;
}

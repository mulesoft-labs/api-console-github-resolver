import { Transport } from './lib/Transport.js';
import { GithubResolver } from './lib/GithubResolver.js';
import { GithubResolverOptions } from './lib/GithubResolverOptions.js';
import { GithubCache } from './lib/GithubCache.js';

export { Transport, GithubResolver, GithubResolverOptions, GithubCache };

/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc <pawel.psztyc@mulesoft.com>
 */
/**
 * Gets the default options for the resolver class.
 * It discovers `GITHUB_TOKEN` variable and if set it uses it to authorize the
 * request.
 *
 * @param {?Object} logger A logger to use.
 * @return {GithubResolverOptions} Options object.
 */
function getResolverOptions(logger) {
  const token = process.env.GITHUB_TOKEN;
  return new GithubResolverOptions({
    token,
    logger
  });
}

/**
 * Sorthand function to `GithubResolver#getLatestInfo()`.
 *
 * @param {?Object} logger A logger to use.
 * @return {Promise<Object>} A promise that resolves to a GitHub release info
 * object.
 */
export const latestInfo = async function(logger) {
  const resolver = new GithubResolver(getResolverOptions(logger));
  return await resolver.getLatestInfo();
};
/**
 * Sorthand function to `GithubResolver#getTagInfo()`.
 *
 * @param {String} tag Release tag name
 * @param {?Object} logger A logger to use.
 * @return {Promise} Resolved promise with an `Object` with release information.
 */
export const tagInfo = async function(tag, logger) {
  const resolver = new GithubResolver(getResolverOptions(logger));
  return await resolver.getTagInfo(tag);
};
/**
 * Sorthand function to `GithubResolver#getReleasesList()`.
 *
 * @param {?Object} logger A logger to use.
 * @return {Promise} Promise resolves to an array of releases information.
 */
export const releasesInfo = async function(logger) {
  const resolver = new GithubResolver(getResolverOptions(logger));
  return await resolver.getReleasesList();
};

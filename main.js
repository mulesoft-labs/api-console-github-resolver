'use strict';

const {Transport} = require('./lib/transport.js');
const {GithubResolver} = require('./lib/github-resolver.js');
const {GithubResolverOptions} = require('./lib/github-resolver-options.js');

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
    token: token,
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
module.exports.latestInfo = function(logger) {
  const resolver = new GithubResolver(getResolverOptions(logger));
  return resolver.getLatestInfo();
};
/**
 * Sorthand function to `GithubResolver#getTagInfo()`.
 *
 * @param {String} tag Release tag name
 * @param {?Object} logger A logger to use.
 * @return {Promise} Resolved promise with an `Object` with release information.
 */
module.exports.tagInfo = function(tag, logger) {
  const resolver = new GithubResolver(getResolverOptions(logger));
  return resolver.getTagInfo(tag);
};
/**
 * Sorthand function to `GithubResolver#getReleasesList()`.
 *
 * @param {String} tag Tag name
 * @param {?Object} logger A logger to use.
 * @return {Promise} Promise resolves to an array of releases information.
 */
module.exports.releasesInfo = function(tag, logger) {
  const resolver = new GithubResolver(getResolverOptions(logger));
  return resolver.getReleasesList(tag);
};
/**
 * A library to get a resource from a secured location.
 */
module.exports.ApiConsoleTransport = Transport;
/**
 * A library to get an information about API console release from GitHub.
 */
module.exports.ApiConsoleGithubResolver = GithubResolver;
/**
 * Options object for the `ApiConsoleGithubResolver`
 */
module.exports.ApiConsoleGithubResolverOptions = GithubResolverOptions;

'use strict';
/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc <pawel.psztyc@mulesoft.com>
 */
/**
 * Options object for the GithubResolver class.
 */
class GithubResolverOptions {
  constructor(opts) {
    opts = opts || {};
    /**
     * GitHub personal token to use with the request.
     */
    this.token = typeof opts.token === 'string' ? opts.token : undefined;
    /**
     * The minimum version of major version of the API console to accept.
     * @type {Number}
     */
    this.minimumTagMajor = typeof opts.minimumTagMajor === 'number' ?
      opts.minimumTagMajor : undefined;
  }
}
exports.GithubResolverOptions = GithubResolverOptions;

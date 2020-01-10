/**
 * Copyright (C) Mulesoft.
 * Shared under Apache 2.0 license
 *
 * @author Pawel Psztyc <pawel.psztyc@mulesoft.com>
 */
/**
 * Options object for the GithubResolver class.
 */
export class GithubResolverOptions {
  constructor(opts={}) {
    /**
     * A console like object to print debug output.
     * If not set and `verbose` option is set then it creates it's own logger.
     */
    this.logger = opts.logger;
    /**
     * GitHub personal token to use with the request.
     */
    this.token = typeof opts.token === 'string' ? opts.token : undefined;
    /**
     * The minimum major release version.
     * Defaults to 5.
     * @type {Number}
     */
    this.minimumTagMajor = typeof opts.minimumTagMajor === 'number' ?
      opts.minimumTagMajor : 5;
    /**
     * The maximum  major release version.
     * @type {Number}
     */
    this.maximumTagMajor = typeof opts.maximumTagMajor === 'number' ?
      opts.maximumTagMajor : undefined;
  }
}

// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

export {GithubResolverOptions};

interface Options {
  logger?: Object;
  token?: string;
  minimumTagMajor?: number;
  maximumTagMajor?: number;
}

/**
 * A GitGub transport class.
 * The transport is based on the HTTPS protocol.
 */
declare class GithubResolverOptions {
  constructor(opts?: Options);
}

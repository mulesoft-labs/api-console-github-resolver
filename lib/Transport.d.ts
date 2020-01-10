// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

export {Transport};

/**
 * A GitGub transport class.
 * The transport is based on the HTTPS protocol.
 */
declare class Transport {
  constructor(logger: Object);
  get(resource: String, headers?: Object): Promise<Object>;
  _optionsForUrl(resource: String, headers?: Object): Object;
  _get(resource: String, headers?: Object): Promise<Object>;
  _processResponse(response: Object): Object|Buffer;
}

// tslint:disable:variable-name Describing an API that's defined elsewhere.
// tslint:disable:no-any describes the API as best we are able today

import { Transport } from './lib/Transport.js';
import { GithubResolver } from './lib/GithubResolver.js';
import { GithubResolverOptions } from './lib/GithubResolverOptions.js';

export { Transport, GithubResolver, GithubResolverOptions };

declare function latestInfo(logger: Object): Promise<Object>;
declare function tagInfo(tag: string, logger: Object): Promise<Object>;
declare function releasesInfo(logger: Object): Promise<Array<Object>>;

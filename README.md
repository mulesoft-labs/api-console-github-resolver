# api-console-github-resolver

**PACKAGE MOVED**

Moved to: https://www.npmjs.com/package/@api-components/api-console-github-resolver

Do not use this version in new projects.

[![Build Status](https://travis-ci.org/advanced-rest-client/multipart-payload-editor.svg?branch=stage)](https://travis-ci.org/mulesoft-labs/api-console-github-resolver)

A npm module to get information about Mulesoft's API console release.

This module is mainly used in the [api-console-builder](https://github.com/mulesoft-labs/api-console-builder).

## API

Shorthand functions:

-   `latestInfo()` -> `new ApiConsoleGithubResolver#getLatestInfo()`
-   `tagInfo(tag)` -> `new ApiConsoleGithubResolver#getTagInfo(tag)`
-   `releasesInfo()` -> `new ApiConsoleGithubResolver#getReleasesList()`

The module exposes 2 classes:

-   [ApiConsoleTransport](lib/transport.js)
-   [ApiConsoleGithubResolver](lib/github-resolver.js)

### Example

```javascript
const resolver = require('api-console-github-resolver');

resolver.latestInfo()
.then(info => console.log(info))
.catch(cause => console.error(cause));
```

equivalent to

```javascript
const {ApiConsoleGithubResolver} = require('api-console-github-resolver');

const resolver = new ApiConsoleGithubResolver();
resolver.getLatestInfo()
.then(info => console.log(info))
.catch(cause => console.error(cause));
```

### ApiConsoleTransport

GitGub transport class.
The transport is based on the HTTPS protocol.

#### `get(resource, headers)`

Gets a resource from given location. This function fallows redirects.

**resource** `String` - URL to the resource.

**headers** `Object` - A list of headers to send.

##### Returns `<Promise>`

A promise resolved to a JavaScript `Object` if compatible content type is detected
or to `Buffer` otherwise.

### ApiConsoleGithubResolver

A class to resolve GitHub repositories versions. It allows to get latest release
version and the url to the release's zip file or list available versions.

#### `getLatestInfo()`

Gets information about latest release.

##### Returns `<Promise>`

Promise resolved to a JavaScript object with the response from GitHub.

#### `getReleasesList()`

Gets information about releases.
GitHub allows 30 items per page by default and this is exactly how much you
will get when calling this function.

##### Returns `<Promise>`

Promise resolves to an array of releases information.

#### `getTagInfo(tag)`

Gets information about tagged release.

**tag** `String` - Release tag name

##### Returns `<Promise>`

Promise resolved to an `Object` with release information.

## GitHub rate limit

GitHub allows to make up to 60 requests per hour. To increate the limit you can
use [GitHub personal token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) as an option passed to the `ApiConsoleGithubResolver` class constructor.

### Example
```javascript
const {ApiConsoleGithubResolver} = require('api-console-github-resolver');

const TOKEN = 'ABCx';
const resolver = new ApiConsoleGithubResolver({
  token: TOKEN
});
resolver.getLatestInfo()
.then(info => console.log(info))
.catch(cause => console.error(cause));
```

Module's shorthand functions reads `GITHUB_TOKEN` environmental variable and
sets it as a configuration option by default.

### Example

```javascript
// index.js
const resolver = require('api-console-github-resolver');

resolver.latestInfo()
.then(info => console.log(info))
.catch(cause => console.error(cause));
```

```shell
$ export GITHUB_TOKEN="ABCx"
$ node index.js
```

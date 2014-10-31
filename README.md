## Deadlink

[![Build Status](https://travis-ci.org/gajus/deadlink.png?branch=master&decache1)](https://travis-ci.org/gajus/deadlink)
[![NPM version](https://badge.fury.io/js/deadlink.svg)](http://badge.fury.io/js/deadlink)

Find dead URLs and references to fragment identifiers.

```
var deadlink = require('deadlink')().Deadlink;

/**
 * Returns a promise that when resolved will equal to the
 * URLs that cannot be resolved.
 * 
 * 
 * @returns {Promise}
 */
deadlink.deadURLs(['http://gajus.com']);

/**
 * Returns a promise that when resolved will equal to the URLs that
 * cannot be resolved, or the response document is not HTML document,
 * or the HTML document does not have the fragment identifier. 
 * 
 * @param {Array} URLs
 * @throws {Error} URL does not have fragment identifier.
 * @returns {Promise}
 */
deadlink.deadFragmentIdentifiers([
    'http://gajus.com/blog/2/#the-definitive-guide-to-the-javascript-generators',
    'http://gajus.com/blog/2/#receive-a-value-from-the-iterator',
    'http://gajus.com/blog/2/#what-problem-do-generators-solve'
]);
```

## Download

Download using [NPM](https://www.npmjs.org/):

```sh
npm install deadlink --save
```
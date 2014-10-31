## Deadlink

[![Build Status](https://travis-ci.org/gajus/deadlink.png?branch=master&decache1)](https://travis-ci.org/gajus/deadlink)
[![NPM version](https://badge.fury.io/js/deadlink.svg)](http://badge.fury.io/js/deadlink)

Find dead URLs and references to fragment identifiers.

```js
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
 * Promise is resolved if the fragment identifier is found.
 * Promise is rejected if the URL cannot be resolved, the resolved
 * document is not an HTML document or the HTML document does not
 * have the fragment identifier.
 * 
 * @param {String} subjectUrl
 * @throws {Error} URL does not have a fragment identifier.
 * @returns {Promise}
 */
deadlink.fragmentIdentifierURL('http://gajus.com/blog/2/#the-definitive-guide-to-the-javascript-generators');

/**
 * Promise is resolved if all of the fragment identifiers are found.
 * Promise is rejected if either of the URLs cannot be resolved, the resolved
 * document is not an HTML document or the HTML document does not
 * have the fragment identifier.
 * Promise is rejected with an array of the URLs that were not resolved.
 * 
 * @param {Array} subjectUrls
 * @returns {Promise}
 */
deadlink.fragmentIdentifierURLs([
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
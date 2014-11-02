## Deadlink

[![Build Status](https://travis-ci.org/gajus/deadlink.png?branch=master)](https://travis-ci.org/gajus/deadlink)
[![NPM version](https://badge.fury.io/js/deadlink.svg)](http://badge.fury.io/js/deadlink)

Find dead URLs and references to fragment identifiers.

```js
var deadlink = require('deadlink')().Deadlink;

deadlink.resolveURL('http://gajus.com');
deadlink.resolveURLs([
    'http://gajus.com/foo',
    'http://gajus.com/bar'
]);
deadlink.resolveFragmentIdentifierURL('http://gajus.com/#foo');
deadlink.resolveFragmentIdentifierURLs([
    'http://gajus.com/#foo',
    'http://gajus.com/#bar'
]);
```

## Download

Download using [NPM](https://www.npmjs.org/):

```sh
npm install deadlink --save
```
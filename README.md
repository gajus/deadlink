## Deadlink

[![Build Status](https://travis-ci.org/gajus/deadlink.png?branch=master)](https://travis-ci.org/gajus/deadlink)
[![NPM version](https://badge.fury.io/js/deadlink.svg)](http://badge.fury.io/js/deadlink)

Find dead URLs and references to fragment identifiers.

## Usage

This guide explains the most common use case, without going into details about the properties of the intermediate results. Some of these properties are useful for further analyzes, such as content inspection.

Refer to the [test cases](https://github.com/gajus/deadlink/tree/master/tests) for the detail explanation of Deadlink behavior.

```js
var deadlink = require('deadlink').Deadlink;
```

### Resolving URLs

URL is resolved with a promise that in turn resolves to `Deadlink.URLResolution`.

```js
var promise = deadlink.resolveURL('http://gajus.com');
```

`Deadlink.URLResolution` of a successful resolution does not have `error` property.

```js
promise.then(function (URLResolution) {
    if (!URLResolution.error) {
        // OK
    }
});
```

Resolving multiple URLs returns a collection of `resolveURL` promises.

```js
var promises = deadlink.resolveURLs([
    'http://gajus.com/foo',
    'http://gajus.com/bar'
]);
```

Use [`Promise.all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) to construct a promise that resolves when all of the promises in the collection are resolved.

```js
Promise.all(promises).then(function () {
    promises.forEach(function (URLResolution) {
        if (!URLResolution.error) {
            // OK
        }
    });
});
```

#### Special Case

There is one special case when promise for a valid response can be rejected.

It is rejected if `Content-Type` is `text/html` and content length is larger than 5MB. Deadlink is storing the response of `text/html` in case `resolveFragmentIdentifierURL` will be referring to the said URL in future. If you foresee this as an issue, [raise an issue](https://github.com/gajus/deadlink/issues) stating your use case.

### Resolving Fragment Identifiers

The API for resolving fragment identifiers (URLs with a hash and a corresponding ID element in the resulting document) is virtually the same.

Deadlink is using to [jsdom](https://github.com/tmpvar/jsdom) to load the document and execute it. Therefore, it will work even if the element IDs of the resulting document are generated dynamically after `DOMContentLoaded` event.

```js
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
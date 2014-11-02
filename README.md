## Deadlink

[![Build Status](https://travis-ci.org/gajus/deadlink.png?branch=master)](https://travis-ci.org/gajus/deadlink)
[![NPM version](https://badge.fury.io/js/deadlink.svg)](http://badge.fury.io/js/deadlink)

Find dead URLs and references to fragment identifiers.

## Usage

```js
var deadlink = require('deadlink').Deadlink;
```

### Resolving URLs

URL is resolved with a promise that in turn resolves to `Deadlink.URLResolution`.

```js
var promise = deadlink.resolveURL('http://gajus.com');
```

If URL has been resolved, then `Deadlink.URLResolution` will not have `error` property.

```js
promise.then(function (URLResolution) {
    URLResolution.error
});
```

```js
deadlink.resolveURLs([
    'http://gajus.com/foo',
    'http://gajus.com/bar'
]);
```

### Resolving Fragment Identifiers

```js
deadlink.resolveFragmentIdentifierURL('http://gajus.com/#foo');
deadlink.resolveFragmentIdentifierURLs([
    'http://gajus.com/#foo',
    'http://gajus.com/#bar'
]);
```

## BDD

```
deadlink
    .resolveURL()
      ✓ Memoizes Deadlink.resolveURL() function
    .resolveFragmentIdentifierDocument()
      ✓ promise is resolved with a Deadlink.fragmentIdentifierDocumentResolution
      ✓ multiple queries against the same document are cached
      Deadlink.FragmentIdentifierDocumentResolution
        successful resolution of the fragment identifier
          ✓ has fragmentIdentifier
        unsuccessful resolution of the fragment identifier
          ✓ has fragmentIdentifier and error
    .resolveFragmentIdentifierURL()
      ✓ throws an error if URL does not have a fragment identifier
      ✓ uses deadlink.resolveURL() to resolve URL
      ✓ uses deadlink.resolveFragmentIdentifierDocument() to look up the fragment
      successful resolution
        ✓ is resolved with Deadlink.FragmentIdentifierURLResolution
        Deadlink.FragmentIdentifierURLResolution
          ✓ has fragmentIdentifier and url
      unsuccessful resolution
        when resource is not loaded
          ✓ is resolved with Deadlink.FragmentIdentifierURLResolution
          Deadlink.FragmentIdentifierURLResolution
            ✓ has error
        when fragment is not found
          ✓ is resolved with Deadlink.FragmentIdentifierURLResolution
          Deadlink.FragmentIdentifierURLResolution
            ✓ has error

  Deadlink
    .resolveURL()
      ✓ promise is resolved with a Deadlink.URLResolution
      Deadlink.URLResolution
        resolution of HTML resource
          ✓ has URL and response body
        resolution of resource other than HTML
          ✓ has URL and content type
        resolution of status code >=400
          ✓ has URL, error and status code
        resolution of HTML resource larger than 1MB
          ✓ is rejected
    .getDocumentIDs()
      ✓ returns IDs from the document
```

## Download

Download using [NPM](https://www.npmjs.org/):

```sh
npm install deadlink --save
```
var Deadlink = {},
    Promise = require('bluebird'),
    http = require('http'),
    url = require('url'),
    jsdom = require('jsdom'),
    crypto = require('crypto'),
    mmm = require('mmmagic'),
    Magic = mmm.Magic;

Deadlink = function () {
    var deadlink = {},
        resolvedURLs = {},
        resolvedDocuments = {};

    /**
     * Memoization of Deadlink.resolveURL.
     *
     * @param {String} subjectURL
     * @param {Promise}
     */
    deadlink.resolveURL = function (subjectURL) {
        subjectURL = Deadlink.normaliseURL(subjectURL);

        if (resolvedURLs[subjectURL] === undefined) {
            resolvedURLs[subjectURL] = Deadlink.resolveURL(subjectURL);
        }

        return resolvedURLs[subjectURL];
    };

    /**
     * Instantiate a collection of promises using deadlink.resolveURL.
     *
     * @param {Array} subjectURLs
     * @return {Object}
     */
    deadlink.resolveURLs = function (subjectURLs) {
        return Promise.all(subjectURLs.map(deadlink.resolveURL));
    };

    /**
     * @param {String} fragmentIdentifier Fragment identifier name (without #).
     * @param {String} inputDocument HTML document.
     */
    deadlink.resolveFragmentIdentifierDocument = function (fragmentIdentifier, inputDocument) {
        var hash = crypto.createHash('md5').update(inputDocument).digest('hex');

        if (resolvedDocuments[hash] === undefined) {
            resolvedDocuments[hash] = Deadlink.getDocumentIDs(inputDocument);
        }

        return new Promise(function (resolve, reject) {
            resolvedDocuments[hash].then(function (ids) {
                if (ids.indexOf(fragmentIdentifier) !== -1) {
                    resolve(new Deadlink.FragmentIdentifierDocumentResolution({fragmentIdentifier: fragmentIdentifier}));
                } else {
                    resolve(new Deadlink.FragmentIdentifierDocumentResolution({fragmentIdentifier: fragmentIdentifier, error: 'Fragment identifier not found in the document.'}));
                }
            });
        });
    };

    deadlink.resolveFragmentIdentifierURL = function (subjectURL) {
        return new Promise(function (resolve, reject) {
            var fragmentIdentifier = url.parse(subjectURL).hash;
        
            if (!fragmentIdentifier) {
                reject(new Error('URL does not have a fragment identifier.'));
            }
            
            fragmentIdentifier = fragmentIdentifier.slice(1);
            
            deadlink.resolveURL(subjectURL)
                .then(function (URLResolution) {
                    if (URLResolution.body) {
                        deadlink.resolveFragmentIdentifierDocument(fragmentIdentifier, URLResolution.body)
                            .then(function (FragmentIdentifierDocumentResolution) {
                                if (!FragmentIdentifierDocumentResolution.error) {
                                    resolve(new Deadlink.FragmentIdentifierURLResolution({
                                        fragmentIdentifier: FragmentIdentifierDocumentResolution.fragmentIdentifier,
                                        url: subjectURL
                                    }));
                                } else {
                                    resolve(new Deadlink.FragmentIdentifierURLResolution({
                                        fragmentIdentifier: FragmentIdentifierDocumentResolution.fragmentIdentifier,
                                        url: subjectURL,
                                        error: FragmentIdentifierDocumentResolution
                                    }));
                                }
                            });
                    } else {
                        resolve(new Deadlink.FragmentIdentifierURLResolution({
                            fragmentIdentifier: fragmentIdentifier,
                            url: subjectURL,
                            error: URLResolution
                        }));
                    }
                });
        });
    };

    return deadlink;
};

/**
 * Treat http://foo.com/ and http://foo.com/#resource-identifier
 * as the same when making a request and looking of the cache.
 *
 * @param {String} subjectURL
 * @return {String}
 */
Deadlink.normaliseURL = function (subjectURL) {
    subjectURL = url.parse(subjectURL);
    delete subjectURL.hash;
    return url.format(subjectURL);
};

/**
 * Makes an HTTP request and responds to the promise.
 * 
 * @param {String} subjectURL
 * @param {Promise}
 */
Deadlink.resolveURL = function (subjectURL) {
    return new Promise(function (resolve, reject) {
        http.get(subjectURL, function (response) {
            var request = this,
                magic,
                responseData = '',
                respondeContentType = response.headers['content-type'];

            if (response.statusCode >= 400) {
                return resolve(
                    new Deadlink.URLResolution({
                        error: 'Resource not resolvable.',
                        url: subjectURL,
                        statusCode: response.statusCode
                    })
                );
            }

            if (respondeContentType.toLowerCase().indexOf('text/html') !== 0) {
                return resolve(
                    new Deadlink.URLResolution({
                        url: subjectURL,
                        contentType: respondeContentType
                    })
                );
            }

            response.on('data', function (chunk) {
                responseData += chunk;

                // 100 * 1000 max buffer size, 100kb
                if (responseData.length > 100 * 1000) {
                    request.abort();

                    return resolve(
                        new Deadlink.URLResolution({
                            error: 'Resource is larger than 100kb.',
                            url: subjectURL
                        })
                    );
                }

                magic = new Magic(false, mmm.MAGIC_MIME_TYPE);

                // Make sure that what we are reading is HTML data.
                magic.detect(chunk, function (err, result) {
                    if (result.toLowerCase().indexOf('text/') !== 0) {
                        request.abort();

                        return reject(new Error('Resource is not text.'));
                    }
                });
            });

            response.on('end', function () {
                resolve(
                    new Deadlink.URLResolution({
                        url: subjectURL,
                        contentType: respondeContentType,
                        body: responseData
                    })
                );
            });
        }).on('error', reject);
    });
};

/**
 * Uses inputDocument string to construct DOM and get list of all IDs in the document.
 */
Deadlink.getDocumentIDs = function (inputDocument) {
    return new Promise(function (resolve, reject) {
        var getIDs = function (document) {
            setTimeout(function () {
                var ids;

                ids = []
                    .slice.apply(document.body.getElementsByTagName('*'))
                    .map(function (node) { return node.id; })
                    .filter(Boolean);

                resolve(ids);
            }, 10);
        };
        jsdom.env({
            html: inputDocument,
            created: function (error) {
                if (error) {
                    return reject(new Error('Document cannot be created.'));
                }
            },
            loaded: function (error) {
                if (error) {
                    return reject(new Error('Document cannot be loaded.'));
                }
            },
            done: function (error, window) {
                // It might be that the fragment identifier on the page are generated using a script
                // such as https://github.com/gajus/contents, in which case IDs won't be available until
                // the document has been loaded and the said script finish processing the document.
                if (window.document.readyState == 'complete') {
                    getIDs(window.document);
                } else {
                    window.document.addEventListener('DOMContentLoaded', function () {
                        getIDs(window.document);
                    });
                }                
            }
        });
    });
};

Deadlink.Resolution = function (data) {
    var resolution = this;
    Object.keys(data).forEach(function (k) {
        resolution[k] = data[k];
    });
};

Deadlink.URLResolution = function () {
    Deadlink.Resolution.apply(this, arguments);
};

Deadlink.URLResolution.prototype = Object.create(Deadlink.Resolution.prototype);

Deadlink.FragmentIdentifierDocumentResolution = function (data) {
    Deadlink.Resolution.apply(this, arguments);
};

Deadlink.FragmentIdentifierDocumentResolution.prototype = Object.create(Deadlink.Resolution.prototype);

Deadlink.FragmentIdentifierURLResolution = function (data) {
    Deadlink.Resolution.apply(this, arguments);
};

Deadlink.FragmentIdentifierURLResolution.prototype = Object.create(Deadlink.Resolution.prototype);

module.exports = Deadlink;
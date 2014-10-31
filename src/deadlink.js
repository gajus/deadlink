var Promise = require('promise'),
    http = require('http'),
    url = require('url'),
    jsdom = require('jsdom');

module.exports = function () {
    var Deadlink;

    Deadlink = function () {
        var deadlink = {},
            requestedUrls = {};

        /**
         * Deadlink.get wrapper with added cache.
         * 
         * @param {String} url
         * @param {Object}
         */
        deadlink.get = function (url) {
            if (requestedUrls[url] === undefined) {
                requestedUrls[url] = Deadlink.get(url);
            }

            return requestedUrls[url];
        };

        /**
         * Returns a promise that when resolved will equal to the URLs that cannot be resolved.
         *
         * @param {Array} urlHaystack
         * @return {Object}
         */
        deadlink.deadURLs = function (urlHaystack) {
            return new Promise(function (resolve) {
                var advance,
                    progress = 0,
                    deadURLs = [];

                advance = function (deadUrl) {
                    if (deadUrl) {
                        deadURLs.push(deadUrl);
                    }

                    if (++progress == urlHaystack.length) {
                        resolve(deadURLs);
                    }
                };

                urlHaystack.forEach(function (url) {
                    deadlink.get(url)
                        .then(advance.bind(null, undefined))
                        .catch(advance.bind(null, url));
                });
            });
        };



        /**
         * Returns a promise that is rejected if the URL cannot be resolved,
         * or the response is not an HTML document or the HTML document does not
         * have the fragment identifier.
         * 
         * @param {String} subjectUrl
         * @throws {Error} URL does not have a fragment identifier.
         * @returns {Promise}
         */
        deadlink.fragmentIdentifierURL = function (subjectUrl) {
            var fragmentIdentifier = url.parse(subjectUrl).hash;
            if (!fragmentIdentifier) {
                throw new Error('URL does not have a fragment identifier.');
            }
            
            return deadlink
                .get(subjectUrl)
                .then(function (document) {
                    return deadlink.fragmentIdentifierDocument(fragmentIdentifier, document);
                });
        };

        /**
         * 
         */
        deadlink.fragmentIdentifierDocument = function (fragmentIdentifier, document) {
            return new Promise(function (resolve, reject) {
                jsdom.env({
                    html: document,
                    created: function (error) {
                        if (error) {
                            throw new Error('Document cannot be created.');
                        }
                    },
                    done: function (error, window) {
                        var ids;

                        if (error) {
                            throw new Error('Document cannot be created.');
                        }

                        ids = []
                            .slice.apply(window.document.body.getElementsByTagName('*'))
                            .map(function (node) { return node.id; })
                            .filter(Boolean);

                        if (ids.indexOf(fragmentIdentifier) !== -1) {
                            resolve();
                        } else {
                            reject();
                        }
                    }
                })
            });
        };

        return deadlink;
    };

    /**
     * Returns promise that is rejected if the resource cannot be loaded,
     * or resolved with the body of the response.
     */
    Deadlink.get = function (url) {
        return new Promise(function (resolve, reject) {
            http.get(url, function (response) {
                if (response.statusCode == 404) {
                    reject('Resource not found.');
                } else if (response.statusCode == 200) {
                    response.setEncoding('utf8');
                    response.on('data', function (data) {
                        resolve(data);
                    });
                } else {
                    throw new Error('Unspecified.');
                }
            }).on('error', reject);
        });
    };

    return Deadlink;
};
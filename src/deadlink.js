var Promise = require('promise'),
    http = require('http');

module.exports = function () {
    var Deadlink;

    Deadlink = function () {
        var deadlink = {},
            requestedUrls = {};

        /**
         * Deadlink.get wrapper with added cache.
         * 
         * @see Deadlink.get
         */
        deadlink.get = function (url) {
            if (requestedUrls[url] === undefined) {
                requestedUrls[url] = Deadlink.get(url);
            }

            return requestedUrls[url];
        };

        /**
         * Returns URLs that cannot be resolved.
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
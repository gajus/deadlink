var Deadlink = {},
    Promise = require('bluebird'),
    http = require('http'),
    url = require('url'),
    jsdom = require('jsdom');

Deadlink = function () {
    var deadlink = {},
        requestedUrls = {};

    Deadlink.Resolution = function (error, result) {
        this.error = error;
        this.result = result;
    };

    /**
     * Promise is resolved if the URL is resolved.
     * Promise is rejected if the status code is 404 or
     * the content-type is not text.
     * 
     * @param {String} subjectURL
     * @param {Promise}
     */
    deadlink.resolveURL = function (subjectURL) {
        // Treat http://foo.com/ and http://foo.com/#resource-identifier
        // as the same when making a request and looking of the cache.
        subjectURL = url.parse(subjectURL);
        delete subjectURL.hash;
        subjectURL = url.format(subjectURL);

        if (requestedUrls[subjectURL] === undefined) {
            requestedUrls[subjectURL] = new Promise(function (resolve, reject) {
                http.get(subjectURL, function (response) {
                    if (response.statusCode == 404) {
                        resolve(new Deadlink.Resolution('Resource not found.'));
                    } else {
                        response.setEncoding('utf8');
                        response.on('data', function (data) {
                            resolve(new Deadlink.Resolution(null, data));
                        });
                    }
                }).on('error', reject);
            });
        }

        return requestedUrls[subjectURL];
    };

    /**
     * Returns a promise that when resolved will equal to the URLs that cannot be resolved.
     *
     * @param {Array} subjectURLs
     * @return {Object}
     */
    deadlink.resolveURLs = function (subjectURLs) {
        return Promise.all(subjectURLs.map(deadlink.resolveURL));
    };

    return deadlink;
};

module.exports = Deadlink;
var Deadlink = {},
    Promise = require('bluebird'),
    http = require('http'),
    url = require('url'),
    jsdom = require('jsdom'),
    mmm = require('mmmagic'),
    Magic = mmm.Magic;

Deadlink = function () {
    var deadlink = {},
        requestedUrls = {}; 

    /**
     * Memoization of Deadlink.resolveURL.
     *
     * @param {String} subjectURL
     * @param {Promise}
     */
    deadlink.resolveURL = function (subjectURL) {
        subjectURL = Deadlink.normaliseURL(subjectURL);

        if (requestedUrls[subjectURL] === undefined) {
            requestedUrls[subjectURL] = Deadlink.resolveURL(subjectURL);
        }

        return requestedUrls[subjectURL];
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

    return deadlink;
};

Deadlink.Resolution = function (data) {
    var resolution = this;
    Object.keys(data).forEach(function (k) {
        resolution[k] = data[k];
    });
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
 * Interpret HTTP response and respond to promise.
 * 
 * Resolution is an instance of Deadlink.Resolution with
 * the following properties:
 * 
 * .error, when status code is >= 400.
 * .statusCode, when status code is >= 400
 * .url
 * .body, when response is HTML document.
 * .contentType, when response is other than HTML document. 
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
                    new Deadlink.Resolution({
                        error: 'Resource not resolvable.',
                        url: subjectURL,
                        statusCode: response.statusCode
                    })
                );
            }

            if (respondeContentType.toLowerCase().indexOf('text/html') !== 0) {
                return resolve(
                    new Deadlink.Resolution({
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
                        new Deadlink.Resolution({
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
                    new Deadlink.Resolution({
                        url: subjectURL,
                        contentType: respondeContentType,
                        body: responseData
                    })
                );
            });
        }).on('error', reject);
    });
};

module.exports = Deadlink;
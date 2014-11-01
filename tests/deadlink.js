var chai = require('chai'),
    expect = chai.expect,
    chaiAsPromised = require('chai-as-promised');
    nock = require('nock'),
    Sinon = require('sinon'),
    Promise = require('bluebird');

/**
 * @see http://stackoverflow.com/a/11477602/368691
 */
function requireNew (module) {
    var modulePath = require.resolve(module);
    
    delete require.cache[modulePath];

    return require(modulePath);
};

chai.use(chaiAsPromised);

describe('deadlink', function () {
    var Deadlink,
        deadlink,
        sinon;
    beforeEach(function () {
        Deadlink = requireNew('../src/deadlink.js');
        deadlink = Deadlink();
        sinon = Sinon.sandbox.create();
    });
    afterEach(function () {
        sinon.restore();
    });
    describe('.resolveURL(url)', function () {
        it('Memoizes Deadlink.resolveURL(url) function', function () {
            var spy = sinon.spy(Deadlink, 'resolveURL');
            nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'text/html'});
            deadlink.resolveURL('http://gajus.com/');
            deadlink.resolveURL('http://gajus.com/');
            deadlink.resolveURL('http://gajus.com/');
            expect(spy.callCount).to.equal(1);
        });
    });
    describe('.resolveURLs(urls)', function () {
        it('instantiates a collection of promises using deadlink.resolveURL', function () {
            var spy = sinon.spy(deadlink, 'resolveURL');
            nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'text/html'});
            deadlink.resolveURLs(['http://gajus.com/', 'http://gajus.com/', 'http://gajus.com/']);
            expect(spy.callCount).to.equal(3);
        });
    });
});

describe('Deadlink', function () {
    var Deadlink;
    beforeEach(function () {
        Deadlink = requireNew('../src/deadlink.js');
    });
    describe('.resolveURL(url)', function () {
        it('promise is resolved with a Deadlink.URLResolution', function () {
            nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'text/html'});
            return Deadlink
                .resolveURL('http://gajus.com')
                .then(function (URLResolution) {
                    expect(URLResolution).to.instanceof(Deadlink.URLResolution);
                });
        });
        describe('Deadlink.URLResolution', function () {
            describe('resolution of HTML resource', function () {
                var promise;
                beforeEach(function () {
                    nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'text/html'});
                    promise = Deadlink
                        .resolveURL('http://gajus.com/');
                });
                it('has URL and response body', function () {
                    return promise.then(function (URLResolution) {
                        expect(URLResolution).to.deep.equal({url: 'http://gajus.com/', contentType: 'text/html', body: 'OK'});
                    });
                });
            });
            describe('resolution of resource other than HTML', function () {
                var promise;
                beforeEach(function () {
                    nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'application/json'});
                    promise = Deadlink
                        .resolveURL('http://gajus.com/');
                });
                it('has URL and content type', function () {
                    return promise.then(function (URLResolution) {
                        expect(URLResolution).to.deep.equal({url: 'http://gajus.com/', contentType: 'application/json'});
                    });
                });
            });
            describe('resolution of status code >=400', function () {
                var promise;
                beforeEach(function () {
                    nock('http://gajus.com').get('/').reply(404, 'OK', {'content-type': 'text/html'});
                    promise = Deadlink
                        .resolveURL('http://gajus.com/');
                });
                it('has URL, error and status code', function () {
                    return promise.then(function (URLResolution) {
                        expect(URLResolution).to.deep.equal({url: 'http://gajus.com/', error: 'Resource not resolvable.', statusCode: 404});
                    });
                });
            });
            describe('resolution of HTML resource larger than 100kb', function () {
                var promise;
                beforeEach(function () {
                    nock('http://gajus.com').get('/').reply(200, Array(100 * 1000 + 100).join('X'), {'content-type': 'text/html'});
                    promise = Deadlink
                        .resolveURL('http://gajus.com/');
                });
                it('has URL and error', function () {
                    return promise.then(function (URLResolution) {
                        expect(URLResolution).to.deep.equal({url: 'http://gajus.com/', error: 'Resource is larger than 100kb.'});
                    });
                });
            });
        });
    });
    describe('.makeDOMFromStringGetIDs(inputDocument)', function () {
        it('returns IDs from the document', function () {
            return Deadlink.makeDOMFromStringGetIDs('<div id="foo"></div><div id="bar"></div><div id="baz"></div>')
                .then(function (ids) {
                    expect(ids).to.deep.equal(['foo', 'bar', 'baz']);
                });
        });
    });
    describe('.resolveFragmentIdentifierDocument(fragmentIdentifier, inputDocument)', function () {
        it('promise is resolved with a Deadlink.fragmentIdentifierDocumentResolution', function () {
            return Deadlink.resolveFragmentIdentifierDocument('foo', '<div id="foo"></div>')
                .then(function (FragmentIdentifierDocumentResolution) {
                    expect(FragmentIdentifierDocumentResolution).to.instanceof(Deadlink.FragmentIdentifierDocumentResolution);
                });
        });
        describe('Deadlink.FragmentIdentifierDocumentResolution', function () {
            describe('successful resolution of the fragment identifier', function () {
                it('has fragmentIdentifier', function () {
                    return Deadlink.resolveFragmentIdentifierDocument('foo', '<div id="foo"></div>')
                        .then(function (FragmentIdentifierDocumentResolution) {
                            expect(FragmentIdentifierDocumentResolution).to.deep.equal({fragmentIdentifier: 'foo'});
                        });
                });
            });
            describe('unsuccessful resolution of the fragment identifier', function () {
                it('has fragmentIdentifier', function () {
                    return Deadlink.resolveFragmentIdentifierDocument('foo', '<div></div>')
                        .then(function (FragmentIdentifierDocumentResolution) {
                            expect(FragmentIdentifierDocumentResolution).to.deep.equal({fragmentIdentifier: 'foo', error: 'Fragment identifier not found in the document.'});
                        });
                });
            });
        });
    });
});
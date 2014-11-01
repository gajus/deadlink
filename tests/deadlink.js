var chai = require('chai'),
    expect = chai.expect,
    chaiAsPromised = require('chai-as-promised');
    nock = require('nock'),
    Sinon = require('sinon'),
    Promise = require('bluebird');

chai.use(chaiAsPromised);

describe('deadlink', function () {
    var Deadlink;
    beforeEach(function () {
        Deadlink = require('../src/deadlink.js');
    });
    describe('.resolveURL(url)', function () {
        it('promise is resolved with a Deadlink.Resolution', function () {
            nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'text/html'});
            return Deadlink
                .resolveURL('http://gajus.com')
                .then(function (Resolution) {
                    expect(Resolution).to.instanceof(Deadlink.Resolution);
                });
                
        });
        describe('Deadlink.Resolution', function () {
            describe('resolution of HTML resource', function () {
                var promise;
                beforeEach(function () {
                    nock('http://gajus.com').get('/').reply(200, 'OK', {'content-type': 'text/html'});
                    promise = Deadlink
                        .resolveURL('http://gajus.com/');
                });
                it('has URL and response body', function () {
                    return promise.then(function (Resolution) {
                        expect(Resolution).to.deep.equal({url: 'http://gajus.com/', contentType: 'text/html', body: 'OK'});
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
                    return promise.then(function (Resolution) {
                        expect(Resolution).to.deep.equal({url: 'http://gajus.com/', contentType: 'application/json'});
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
                    return promise.then(function (Resolution) {
                        expect(Resolution).to.deep.equal({url: 'http://gajus.com/', error: 'Resource not resolvable.', statusCode: 404});
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
                    return promise.then(function (Resolution) {
                        expect(Resolution).to.deep.equal({url: 'http://gajus.com/', error: 'Resource is larger than 100kb.'});
                    });
                });
            });
        });
    });
});
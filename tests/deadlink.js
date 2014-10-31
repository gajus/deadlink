var chai = require('chai'),
    expect = chai.expect,
    chaiAsPromised = require('chai-as-promised');
    nock = require('nock'),
    Sinon = require('sinon'),
    Promise = require('bluebird');

//require('mocha-as-promised')();

chai.use(chaiAsPromised);

describe('deadlink', function () {
    var Deadlink,
        deadlink,
        sinon;
    beforeEach(function () {
        Deadlink = require('../src/deadlink.js');
        deadlink = Deadlink();
        sinon = Sinon.sandbox.create();
    });
    afterEach(function () {
        sinon.restore();
    });
    describe('.resolveURL(url)', function () {
        it('promise is resolved with a Deadlink.Resolution', function () {
            nock('http://gajus.com').get('/').reply(200, 'OK');
            return deadlink
                .resolveURL('http://gajus.com')
                .then(function (Resolution) {
                    expect(Resolution).to.instanceof(Deadlink.Resolution);
                });
        });
        describe('Deadlink.Resolution of successful resource resolution', function () {
            it('has no error', function () {
                nock('http://gajus.com').get('/').reply(200, 'OK');
                    return deadlink
                        .resolveURL('http://gajus.com')
                        .then(function (Resolution) {
                            expect(Resolution.error).to.null;
                        });
            });
            it('has body of the resolved resource', function () {
                nock('http://gajus.com').get('/').reply(200, 'OK');
                    return deadlink
                        .resolveURL('http://gajus.com')
                        .then(function (Resolution) {
                            expect(Resolution.result).to.equal('OK');
                        });
            });
        });
        describe('Deadlink.Resolution of unsuccessful resource resolution', function () {
            it('has error', function () {
                nock('http://gajus.com').get('/').reply(404);
                    return deadlink
                        .resolveURL('http://gajus.com')
                        .then(function (Resolution) {
                            expect(Resolution.error).to.equal('Resource not found.');
                        });
            });
        });
    });
    describe('.resolveURLs(urls)', function () {
        it('promise is resolved with a Deadlink.Resolution collection', function () {
            var spy = sinon.spy(deadlink, 'resolveURL');

            nock('http://gajus.com').get('/found-1').reply(200, 'OK');
            nock('http://gajus.com').get('/found-2').reply(200, 'OK');
            nock('http://gajus.com').get('/found-3').reply(200, 'OK');

            return deadlink
                .resolveURLs(['http://gajus.com/found-1', 'http://gajus.com/found-2', 'http://gajus.com/found-3'])
                .then(function (Resolutions) {
                    expect(spy.calledWith('http://gajus.com/found-1')).to.true;
                    expect(spy.calledWith('http://gajus.com/found-2')).to.true;
                    expect(spy.calledWith('http://gajus.com/found-3')).to.true;
                    expect(spy.callCount).to.equal(3);
                    expect(Resolutions.length).to.equal(3);
                    expect(Resolutions[0]).to.instanceof(Deadlink.Resolution);
                });
        });
    });
});
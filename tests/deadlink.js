var chai = require('chai'),
    expect = chai.expect,
    chaiAsPromised = require('chai-as-promised');
    nock = require('nock'),
    sinon = require('sinon');

chai.use(chaiAsPromised);

describe('Deadlink', function () {
    var Deadlink;
    beforeEach(function () {
        Deadlink = require('../src/deadlink.js')();
    });
    describe('.get(url)', function () {
        it('throws an error if HTTP status code is 404', function () {
            nock('http://gajus.com').get('/').reply(404);
            return expect(Deadlink.get('http://gajus.com')).rejectedWith('Resource not found.');
        });
        it('returns body if HTTP status code is 200', function () {
            nock('http://gajus.com').get('/').reply(200, 'OK');
            return expect(Deadlink.get('http://gajus.com')).eventually.equal('OK');
        });
        // @todo File URL
        // @todo Redirect URL
    });
});

describe('deadlink', function () {
    var Deadlink,
        deadlink;
    beforeEach(function () {
        Deadlink = require('../src/deadlink.js')();
        deadlink = Deadlink();
    });
    describe('.get(url)', function () {
        it('passes the call to Deadlink.get(url)', function () {
            var spy = sinon.spy();
            Deadlink.get = spy;
            deadlink.get('http://gajus.com');
            expect(spy.calledWith('http://gajus.com')).to.be.true;
        });
        it('caches multiple requests for the same resource', function () {
            var spy = sinon.spy();
            Deadlink.get = function () {
                spy();

                return '';
            };
            deadlink.get('http://gajus.com');
            deadlink.get('http://gajus.com');
            expect(spy.callCount).to.equal(1);
        });
    });
    describe('.deadURLs(url)', function () {
        it('returns dead URLs', function () {
            var promise;

            nock('http://gajus.com').get('/found').reply(200, 'OK');
            nock('http://gajus.com').get('/not-found-1').reply(404);
            nock('http://gajus.com').get('/not-found-2').reply(404);

            promise = deadlink.deadURLs(['http://gajus.com/found', 'http://gajus.com/not-found-1', 'http://gajus.com/not-found-2']);
            
            return expect(promise).eventually.deep.equal(['http://gajus.com/not-found-1', 'http://gajus.com/not-found-2']);
        });
    });
});
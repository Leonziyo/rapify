const expect = require('chai').expect;
const httpMocks = require('../../mocks/http');
const endpointResponse = require('../../../src/middleware/endpointResponse');

describe('endpointResponse', () => {
    let request;
    let response;

    beforeEach(() => {
        request = httpMocks.request.default();
        response = httpMocks.response.default();
    });

    it('should call next without arguments when req.locals.response is undefined', () => {
        endpointResponse(request, response, (...args) => {
            expect(args).to.have.lengthOf(0);
        });
    });

    it('should send a json response when req.locals.response is defined', () => {
        response.locals.response = {
            users: [
                { name: 'leo' },
            ],
        };

        endpointResponse(request, response, () => {
            expect.fail({}, {}, 'next function must not be called');
        });

        const data = JSON.parse(response._getData());

        expect(data).to.eqls(response.locals.response);
    });
});

const expect = require('chai').expect;
const httpMocks = require('../../mocks/http');
const endpointValidator = require('../../../src/middleware/endpointValidator');
const ListError = require('../../../src/errors/list');
const InvalidApiParameterError = require('../../../src/errors/invalidApiParameter');

describe('endpointValidator', () => {
    it('should call next without arguments when res.locals.wasRouteHandled is true and do not modify req.rapify', async () => {
        let error;
        const req = httpMocks.request.rapify.endpoint({});
        const res = httpMocks.response.default(true);

        await endpointValidator(req, res, (err) => { error = err; });

        expect(error).to.eqls(undefined);
        expect(req.rapify.input).to.eqls(undefined);
        expect(req.rapify.body).to.eqls(undefined);
        expect(req.rapify.params).to.eqls(undefined);
        expect(req.rapify.query).to.eqls(undefined);
        expect(req.rapify.props).to.eqls(undefined);
    });

    it('should generate props based on propsMap', async () => {
        const endpoint = {
            propsMap: {
                role: () => 'basic',
            },
            props: {
                role: {
                    constraints: {
                    },
                },
            },
        };

        let error;
        const req = httpMocks.request.rapify.endpoint(endpoint);
        const res = httpMocks.response.default();

        await endpointValidator(req, res, (err) => { error = err; });

        expect(error).to.eqls(undefined);
        expect(req.rapify.props).to.eqls({ role: 'basic' });
    });

    describe('keep extra fields', () => {
        it('should keep extra fields in body', async () => {
            const endpoint = {
                keepExtraFields: true,
            };
            const bundle = {
                method: 'POST',
                url: '/users',
                body: {
                    name: 'leo',
                    age: 22,
                },
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(bundle.body);
            expect(req.rapify.body).to.eqls(bundle.body);
        });

        it('should keep extra fields in query', async () => {
            const endpoint = {
                keepExtraFields: true,
            };
            const bundle = {
                method: 'GET',
                url: '/users',
                query: {
                    name: 'leo',
                    age: 22,
                },
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(bundle.query);
            expect(req.rapify.query).to.eqls(bundle.query);
        });

        it('should keep extra fields in params', async () => {
            const endpoint = {
                keepExtraFields: true,
            };
            const bundle = {
                method: 'GET',
                url: '/users/123',
                params: {
                    id: 123,
                },
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(bundle.params);
            expect(req.rapify.params).to.eqls(bundle.params);
        });

        it('should keep extra fields in props', async () => {
            const endpoint = {
                keepExtraFields: true,
                propsMap: {
                    role: () => 'basic',
                },
            };
            const bundle = {
                method: 'GET',
                url: '/users',
            };
            const props = {
                role: 'basic',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(props);
            expect(req.rapify.props).to.eqls(props);
        });
    });

    describe('ignore extra fields', () => {
        it('should ignore extra fields in body', async () => {
            const endpoint = {
                body: {
                    name: {
                    },
                },
            };
            const bundle = {
                method: 'POST',
                url: '/users',
                body: {
                    name: 'leo',
                    age: 22,
                },
            };
            const body = {
                name: 'leo',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(body);
            expect(req.rapify.body).to.eqls(body);
        });

        it('should ignore extra fields in query', async () => {
            const endpoint = {
                query: {
                    name: {
                    },
                },
            };
            const bundle = {
                method: 'GET',
                url: '/users',
                query: {
                    name: 'leo',
                    age: 22,
                },
            };
            const query = {
                name: 'leo',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(query);
            expect(req.rapify.query).to.eqls(query);
        });

        it('should ignore extra fields in params'); // params are always kept

        it('should ignore extra fields in props', async () => {
            const endpoint = {
                propsMap: {
                    role: () => 'basic',
                    agent: () => 'extra',
                },
                props: {
                    role: {
                    },
                },
            };
            const bundle = {
                method: 'GET',
                url: '/users',
                query: {
                    name: 'leo',
                    age: 22,
                },
            };
            const props = {
                role: 'basic',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(props);
            expect(req.rapify.props).to.eqls(props);
            expect(req.rapify.query).to.eqls({});
        });
    });

    describe('sanitize requests', () => {
        it('should sanitize fields in body', async () => {
            const endpoint = {
                body: {
                    name: {
                        sanitize: val => `${val}-123`,
                    },
                },
            };
            const bundle = {
                method: 'POST',
                url: '/users',
                body: {
                    name: 'leo',
                },
            };
            const body = {
                name: 'leo-123',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(body);
            expect(req.rapify.body).to.eqls(body);
        });

        it('should sanitize fields in query', async () => {
            const endpoint = {
                query: {
                    name: {
                        sanitize: val => `${val}-123`,
                    },
                },
            };
            const bundle = {
                method: 'POST',
                url: '/users',
                query: {
                    name: 'leo',
                },
            };
            const query = {
                name: 'leo-123',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(query);
            expect(req.rapify.query).to.eqls(query);
        });

        it('should sanitize fields in params', async () => {
            const endpoint = {
                params: {
                    name: {
                        sanitize: val => `${val}-123`,
                    },
                },
            };
            const bundle = {
                method: 'POST',
                url: '/users',
                params: {
                    name: 'leo',
                },
            };
            const params = {
                name: 'leo-123',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(params);
            expect(req.rapify.params).to.eqls(params);
        });

        it('should sanitize fields in props', async () => {
            const endpoint = {
                propsMap: {
                    role: () => 'basic',
                },
                props: {
                    role: {
                        sanitize: val => `${val}-123`,
                    },
                },
            };
            const bundle = {
                method: 'POST',
                url: '/users',
            };
            const props = {
                role: 'basic-123',
            };

            let error;
            const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
            const res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
            expect(req.rapify.input).to.eqls(props);
            expect(req.rapify.props).to.eqls(props);
        });
    });

    describe('validate requests', () => {
        it('should validate fields in body', async () => {
            const endpoint = {
                body: {
                    name: {
                        constraints: {
                            format: {
                                pattern: /[a-zA-Z]{4,20}/,
                                message: '^name must be 4 to 20 characters long.',
                            },
                        },
                    },
                },
            };
            const badBundle = {
                method: 'POST',
                url: '/users',
                body: {
                    name: 'leo',
                },
            };
            const goodBundle = {
                method: 'POST',
                url: '/users',
                body: {
                    name: 'leonso',
                },
            };

            let error;
            let req = httpMocks.request.rapify.endpoint(endpoint, badBundle);
            let res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.be.an.instanceOf(ListError);
            expect(error.list).to.have.lengthOf(1);
            expect(error.list[0]).to.be.instanceOf(InvalidApiParameterError);

            req = httpMocks.request.rapify.endpoint(endpoint, goodBundle);
            res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
        });

        it('should validate fields in query', async () => {
            const endpoint = {
                query: {
                    name: {
                        constraints: {
                            format: {
                                pattern: /[a-zA-Z]{4,20}/,
                                message: '^name must be 4 to 20 characters long.',
                            },
                        },
                    },
                },
            };
            const badBundle = {
                method: 'POST',
                url: '/users',
                query: {
                    name: 'leo',
                },
            };
            const goodBundle = {
                method: 'POST',
                url: '/users',
                query: {
                    name: 'leonso',
                },
            };

            let error;
            let req = httpMocks.request.rapify.endpoint(endpoint, badBundle);
            let res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.be.an.instanceOf(ListError);
            expect(error.list).to.have.lengthOf(1);
            expect(error.list[0]).to.be.instanceOf(InvalidApiParameterError);

            req = httpMocks.request.rapify.endpoint(endpoint, goodBundle);
            res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
        });

        it('should validate fields in params', async () => {
            const endpoint = {
                params: {
                    name: {
                        constraints: {
                            format: {
                                pattern: /[a-zA-Z]{4,20}/,
                                message: '^name must be 4 to 20 characters long.',
                            },
                        },
                    },
                },
            };
            const badBundle = {
                method: 'GET',
                url: '/users/leo',
                params: {
                    name: 'leo',
                },
            };
            const goodBundle = {
                method: 'GET',
                url: '/users/leonso',
                params: {
                    name: 'leonso',
                },
            };

            let error;
            let req = httpMocks.request.rapify.endpoint(endpoint, badBundle);
            let res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.be.an.instanceOf(ListError);
            expect(error.list).to.have.lengthOf(1);
            expect(error.list[0]).to.be.instanceOf(InvalidApiParameterError);

            req = httpMocks.request.rapify.endpoint(endpoint, goodBundle);
            res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
        });

        it('should validate fields in props', async () => {
            const endpoint = {
                propsMap: {
                    name: req => req.query.name,
                },
                props: {
                    name: {
                        constraints: {
                            format: {
                                pattern: /[a-zA-Z]{4,20}/,
                                message: '^name must be 4 to 20 characters long.',
                            },
                        },
                    },
                },
            };
            const badBundle = {
                method: 'GET',
                url: '/users',
                query: {
                    name: 'leo',
                },
            };
            const goodBundle = {
                method: 'GET',
                url: '/users',
                query: {
                    name: 'leonso',
                },
            };

            let error;
            let req = httpMocks.request.rapify.endpoint(endpoint, badBundle);
            let res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.be.an.instanceOf(ListError);
            expect(error.list).to.have.lengthOf(1);
            expect(error.list[0]).to.be.instanceOf(InvalidApiParameterError);

            req = httpMocks.request.rapify.endpoint(endpoint, goodBundle);
            res = httpMocks.response.default();

            await endpointValidator(req, res, (err) => { error = err; });

            expect(error).to.eqls(undefined);
        });

        describe('complex rules', () => {
            const endpoint = {
                body: {
                    // primitive
                    username: {
                        constraints: {
                            presence: {
                                message: '^Is required.',
                            },
                            format: {
                                pattern: /[a-zA-Z]{4,20}/,
                                message: '^Name must be 4 to 20 characters long.',
                            },
                        },
                    },
                    // nested objects
                    user: {
                        name: {
                            constraints: {
                                presence: {
                                    message: '^Is required.',
                                },
                                format: {
                                    pattern: /[a-zA-Z]{3,20}/,
                                    message: '^Must include characters a through z.',
                                },
                            },
                        },
                        ages: [{
                            arrayConstraints: {
                                presence: {
                                    message: '^Is required.',
                                },
                                length: {
                                    minimum: 1,
                                    message: '^At least one element is required.',
                                },
                            },
                            constraints: {
                                custom: {
                                    validate(input, value) {
                                        if (input.username === 'leos') {
                                            return '^Leos is not a valid username.';
                                        }

                                        return undefined;
                                    },
                                },
                            },
                        }],
                    },
                    // array of primitives
                    ages: [{
                        arrayConstraints: {
                            presence: {
                                message: '^Is required.',
                            },
                            length: {
                                minimum: 2,
                                message: '^At least two elements are required.',
                            },
                        },
                        constraints: {
                            numericality: {
                                message: '^Must be a number.',
                            },
                        },
                        sanitize: val => +val,
                    }],
                    // array of objects
                    users: [{
                        arrayConstraints: {
                            presence: {
                                message: '^Is required.',
                            },
                            length: {
                                minimum: 1,
                                message: '^At least one element is required.',
                            },
                        },

                        name: {
                            constraints: {
                                presence: {
                                    message: '^Is required.',
                                },
                                format: {
                                    pattern: /[a-zA-Z]{3,20}/,
                                    message: '^Must contain characters a through z.',
                                },
                            },
                        },
                        ages: [{
                            arrayConstraints: {
                                presence: {
                                    message: '^Is required.',
                                },
                                length: {
                                    minimum: 1,
                                    message: '^At least one element is required.',
                                },
                            },

                            constraints: {
                                numericality: {
                                    message: '^Must be a number.',
                                },
                            },
                            sanitize: val => +val,
                        }],
                        errors: [{
                            type: {
                                constraints: {
                                    presence: {
                                        message: '^Is required.',
                                    },
                                    format: {
                                        pattern: /.*Error$/,
                                        message: '^Must end with the word Error.',
                                    },
                                },
                            },
                            ages: [{
                                arrayConstraints: {
                                    presence: {
                                        message: '^Is required.',
                                    },
                                    length: {
                                        minimum: 1,
                                        message: '^At least one element is required.',
                                    },
                                },
                                constraints: {
                                    numericality: {
                                        message: '^Must be a number.',
                                    },
                                },
                                sanitize: val => +val,
                            }],
                        }],
                    }],
                },
            };

            it('should validate correctly', async () => {
                const bundle = {
                    method: 'POST',
                    url: '/users',
                    body: {
                        username: 'thedude',
                        user: {
                            name: 'thedude',
                            ages: [18],
                        },
                        ages: [18, 22],
                        users: [
                            {
                                name: 'thedude',
                                ages: ['23'],
                                errors: [
                                    {
                                        type: 'InvalidError',
                                        ages: [1],
                                    },
                                ],
                            },
                        ],
                    },
                };

                const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
                const res = httpMocks.response.default();
                let error;

                await endpointValidator(req, res, (err) => { error = err; });

                expect(error).to.eqls(undefined);
            });

            it('should validate incorrectly', async () => {
                const bundle = {
                    method: 'POST',
                    url: '/users',
                    body: {
                        username: 'bad',
                        user: {
                            ages: [],
                        },
                        ages: ['a', 2],
                        users: [
                            {
                                name: 'leo',
                                ages: [
                                    '12',
                                ],
                                errors: [
                                    {
                                        type: 'WeirdErrors',
                                    },
                                ],
                            },
                        ],
                    },
                };
                let error;
                const req = httpMocks.request.rapify.endpoint(endpoint, bundle);
                const res = httpMocks.response.default();

                await endpointValidator(req, res, (err) => { error = err; });

                expect(error).to.be.an.instanceOf(ListError);
                expect(error.list).to.have.lengthOf(6);

                const errorList = {
                    username: {
                        type: 'InvalidApiParameter',
                        message: 'Name must be 4 to 20 characters long.',
                    },
                    'user.name': {
                        type: 'InvalidApiParameter',
                        message: 'Is required.',
                    },
                    'user.ages': {
                        type: 'InvalidApiParameter',
                        message: 'At least one element is required.',
                    },
                    'ages.0': {
                        type: 'InvalidApiParameter',
                        message: 'Must be a number.',
                    },
                    'users.0.errors.0.type': {
                        type: 'InvalidApiParameter',
                        message: 'Must end with the word Error.',
                    },
                    'users.0.errors.0.ages': {
                        type: 'InvalidApiParameter',
                        message: 'Is required.',
                    },
                };

                const missMatch = error.list.find((n) => {
                    const match = errorList[n.parameterName];

                    return !match || match.type !== n.type || match.message !== n.message;
                });

                expect(missMatch).to.eqls(undefined);
            });
        });
    });
});

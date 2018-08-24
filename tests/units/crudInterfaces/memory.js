const expect = require('chai').expect;
const memoryInterface = require('../../../src/crudInterfaces/memory');
const httpMocks = require('../../../tests/mocks/http');
const ResourceNotFoundError = require('../../../src/errors/resourceNotFound');
const throwWrapper = require('../../../tests/helpers/throwWrapper');

describe('memory CRUD interface', () => {
    describe('initialization', () => {
        it('should return CRUD methods', () => {
            const int = memoryInterface();

            expect(typeof int.create).to.equal('function');
            expect(typeof int.read).to.equal('function');
            expect(typeof int.update).to.equal('function');
            expect(typeof int.delete).to.equal('function');
            expect(typeof int.paginate).to.equal('function');
        });

        it('should initialize with an empty set', async () => {
            const int = memoryInterface();
            const query = httpMocks.input.pagination(1, 20);
            const rapify = httpMocks.input.rapify({ query });

            const pagination = await int.paginate(rapify);
            // eslint-disable-next-line no-unused-expressions
            expect(pagination).to.be.empty;
        });

        it('should initialize with a default value', async () => {
            const int = memoryInterface([{ id: 1 }]);
            const query = httpMocks.input.pagination(1, 20);
            const rapify = httpMocks.input.rapify({ query });

            const pagination = await int.paginate(rapify);
            expect(pagination).to.have.lengthOf(1);
        });
    });

    describe('CRUD operations', () => {
        describe('success', () => {
            let newUser;
            const originalName = 'leo';
            const originalAge = 22;
            const crudInterface = memoryInterface();

            beforeEach(async () => {
                const body = {
                    name: originalName,
                    age: originalAge,
                };
                const rapify = httpMocks.input.rapify({ body });

                newUser = await crudInterface.create(rapify);
            });

            it('should create a document', async () => {
                expect(newUser.name).to.equal(originalName);
                expect(newUser.age).to.equal(originalAge);
            });

            it('should read a document', async () => {
                const params = { id: newUser.id };
                const rapify = httpMocks.input.rapify({ params });
                const user = await crudInterface.read(rapify);

                expect(user.name).to.equal(originalName);
                expect(user.age).to.equal(originalAge);
            });

            it('should update a document', async () => {
                const name = 'leonso';
                const age = 88;
                const params = { id: newUser.id };
                const body = { name, age };
                const rapify = httpMocks.input.rapify({ params, body });
                const user = await crudInterface.update(rapify);

                expect(user.name).to.equal(name);
                expect(user.age).to.equal(age);
            });

            it('should delete a document', async () => {
                const params = { id: newUser.id };
                const rapify = httpMocks.input.rapify({ params });
                await crudInterface.delete(rapify);

                const throwable = await throwWrapper(() => crudInterface.read(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });

            it('should paginate a document');

            it('should create a document with mappedData', async () => {
                const body = {
                    name: 'leos',
                    age: 222,
                };
                const rapify = httpMocks.input.rapify({ body });

                const mappedData = {
                    name: 'leos2',
                    age: 18,
                };

                const user = await crudInterface.create(rapify, mappedData);

                expect(user.name).to.equal(mappedData.name);
                expect(user.age).to.equal(mappedData.age);
            });

            it('should update a document with mappedData', async () => {
                const name = 'leonso';
                const age = 88;
                const params = { id: newUser.id };
                const body = { name, age };
                const rapify = httpMocks.input.rapify({ params, body });

                const mappedData = {
                    name: 'leos2',
                    age: 18,
                };

                const user = await crudInterface.update(rapify, mappedData);

                expect(user.name).to.equal(mappedData.name);
                expect(user.age).to.equal(mappedData.age);
            });
        });

        describe('fail', () => {
            const crudInterface = memoryInterface();

            it('should throw not found error', async () => {
                const rapify = httpMocks.input.rapify({
                    params: {
                        id: 123,
                    },
                });

                const throwable = await throwWrapper(() => crudInterface.read(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });

            it('should not update a non existant document', async () => {
                const rapify = httpMocks.input.rapify({
                    params: { id: 123 },
                    body: { name: 'test' },
                });

                const throwable = await throwWrapper(() => crudInterface.update(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });

            it('should not delete a non existant document', async () => {
                const rapify = httpMocks.input.rapify({
                    params: { id: 123 },
                });

                const throwable = await throwWrapper(() => crudInterface.delete(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });
        });
    });
});

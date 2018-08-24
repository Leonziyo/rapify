const expect = require('chai').expect;
const ObjectId = require('mongoose').Types.ObjectId;
const mongooseInterface = require('../../../src/crudInterfaces/mongoose');
const httpMocks = require('../../../tests/mocks/http');
const ResourceNotFoundError = require('../../../src/errors/resourceNotFound');
const throwWrapper = require('../../../tests/helpers/throwWrapper');
const mongooseHelper = require('../../../tests/helpers/mongoose');

const User = mongooseHelper.models.User;

before(async () => {
    await mongooseHelper.init();
});

after(async () => {
    await User.remove({});
    await mongooseHelper.stop();
});

describe('mongoose CRUD interface', () => {
    describe('initialization', () => {
        it('should fail by passing an invalid model', () => {
            expect(() => mongooseInterface()).to.throw();
        });

        it('should return CRUD methods', () => {
            const int = mongooseInterface(User);

            expect(typeof int.create).to.equal('function');
            expect(typeof int.read).to.equal('function');
            expect(typeof int.update).to.equal('function');
            expect(typeof int.delete).to.equal('function');
            expect(typeof int.paginate).to.equal('function');
        });
    });

    describe('CRUD operations', () => {
        describe('success', () => {
            let newUser;
            const originalName = 'leo';
            const originalAge = 22;
            const crudInterface = mongooseInterface(User);

            beforeEach(async () => {
                const body = {
                    name: originalName,
                    age: originalAge,
                };
                const rapify = httpMocks.input.rapify({ body });

                newUser = await crudInterface.create(rapify);
            });

            afterEach(async () => {
                await User.remove({});
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

            it('should paginate a document', async () => {
                const query = httpMocks.input.pagination(1, 20, '_id', 'desc');
                const rapify = httpMocks.input.rapify({ query });
                const result = await crudInterface.paginate(rapify);

                expect(result).to.have.keys(['pagination', 'documents']);
                expect(result).to.nested.include({
                    'pagination.page': 1,
                    'pagination.pageSize': 20,
                    'pagination.totalPages': 1,
                    'pagination.totalDocuments': 1,
                });
                expect(result.documents).to.have.lengthOf(1);

                const doc = result.documents[0];

                expect(doc).to.include({ name: originalName, age: originalAge });
            });

            it('should paginate 2 pages', async () => {
                await User.remove({});

                const total = 48;
                const pageSize = 25;
                const totalPages = Math.ceil(total / pageSize);
                const docs = [];
                for (let i = 0; i < total; i += 1) {
                    docs.push({ name: 'leos', age: i });
                }

                await User.create(docs);

                let query = httpMocks.input.pagination(1, pageSize, '_id', 'desc');
                let rapify = httpMocks.input.rapify({ query });
                let result = await crudInterface.paginate(rapify);

                expect(result).to.have.keys(['pagination', 'documents']);
                expect(result).to.nested.include({ 'pagination.page': 1 });
                expect(result).to.nested.include({ 'pagination.pageSize': pageSize });
                expect(result).to.nested.include({ 'pagination.totalPages': totalPages });
                expect(result).to.nested.include({ 'pagination.totalDocuments': total });

                query = httpMocks.input.pagination(2, pageSize, '_id', 'desc');
                rapify = httpMocks.input.rapify({ query });
                result = await crudInterface.paginate(rapify);

                expect(result).to.have.keys(['pagination', 'documents']);
                expect(result).to.nested.include({ 'pagination.page': 2 });
                expect(result).to.nested.include({ 'pagination.pageSize': pageSize });
                expect(result).to.nested.include({ 'pagination.totalPages': totalPages });
                expect(result).to.nested.include({ 'pagination.totalDocuments': total });
            });

            it('should sort pagination by name', async () => {
                const docs = [
                    { name: 'leo', age: 40 },
                    { name: 'fred', age: 22 },
                    { name: 'zack', age: 21 },
                    { name: 'tom', age: 20 },
                    { name: 'alan', age: 30 },
                    { name: 'john', age: 20 },
                    { name: 'bob', age: 25 },
                ];
                await User.remove({});
                await User.create(docs);

                const query = httpMocks.input.pagination(1, 20, 'name', 'asc');
                const rapify = httpMocks.input.rapify({ query });
                const result = await crudInterface.paginate(rapify);

                expect(result.documents).to.have.lengthOf(7);

                const doc = result.documents[1];

                expect(doc).to.include({ name: 'bob', age: 25 });
            });

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
            let crudInterface;

            before(() => {
                crudInterface = mongooseInterface(User);
            });

            it('should throw not found error', async () => {
                const rapify = httpMocks.input.rapify({
                    params: {
                        id: ObjectId(),
                    },
                });

                const throwable = await throwWrapper(() => crudInterface.read(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });

            it('should not update a non existant document', async () => {
                const rapify = httpMocks.input.rapify({
                    params: { id: ObjectId() },
                    body: { name: 'test' },
                });

                const throwable = await throwWrapper(() => crudInterface.update(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });

            it('should not delete a non existant document', async () => {
                const rapify = httpMocks.input.rapify({
                    params: { id: ObjectId() },
                });

                const throwable = await throwWrapper(() => crudInterface.delete(rapify));
                expect(throwable).to.throw(ResourceNotFoundError);
            });

            it('should not paginate with invalid pagination options', async () => {
                const rapify = httpMocks.input.rapify({
                    query: {},
                });

                const throwable = await throwWrapper(() => crudInterface.paginate(rapify));
                expect(throwable).to.throw();
            });
        });
    });
});

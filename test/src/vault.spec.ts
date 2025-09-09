import { Batch } from '@mparticle/event-models';
import { expect } from 'chai';
import { Dictionary } from '../../src/utils';
import { createVault, LocalStorageVault } from '../../src/vault';
import { VaultKind } from '../../src/constants';

const testObject: Dictionary<Dictionary<string>> = {
    foo: { foo: 'bar', buzz: 'bazz' },
    pinky: { narf: 'poit' },
};

const testArray: Dictionary<string>[] = [
    { foo: 'bar', buzz: 'bazz' },
    { narf: 'poit' },
];

const testString = 'foo';
const testNumber = 123;

describe('Vault', () => {
    describe('SessionStorageVault', () => {
        afterEach(() => {
            window.sessionStorage.clear();
        });

        describe('#store', () => {
            it('should store an object', () => {
                const storageKey = 'test-key-store-object';

                const vault = createVault<Dictionary<Dictionary<string>>>(
                    storageKey,
                    VaultKind.SessionStorage
                );

                vault.store(testObject);

                expect(vault.contents).to.equal(testObject);
                expect(window.sessionStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testObject),
                );
            });

            it('should store an array', () => {
                const storageKey = 'test-key-store-array';

                const vault = createVault<Dictionary<string>[]>(
                    storageKey,
                    VaultKind.SessionStorage
                );

                vault.store(testArray);

                expect(vault.contents).to.equal(testArray);
                expect(window.sessionStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testArray),
                );
            });

            it('should store a string', () => {
                const storageKey = 'test-key-store-string';

                const vault = createVault<string>(storageKey, VaultKind.SessionStorage);

                vault.store(testString);

                expect(vault.contents).to.equal(testString);
                expect(window.sessionStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testString),
                );
            });

            it('should store a number', () => {
                const storageKey = 'test-key-store-number';

                const vault = createVault<number>(storageKey, VaultKind.SessionStorage);

                vault.store(testNumber);

                expect(vault.contents).to.equal(testNumber);
                expect(window.sessionStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testNumber),
                );
            });
        });

        describe('#retrieve', () => {
            it('should retrieve an object', () => {
                const storageKey = 'test-key-retrieve-object';

                window.sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(testObject),
                );

                const vault = createVault<Dictionary<Dictionary<string>>>(
                    storageKey,
                    VaultKind.SessionStorage
                );

                const retrievedItem = vault.retrieve();

                // We are storing a simple object, so we are not doing a
                // deep equals, merely making sure the two objects
                // match
                expect(retrievedItem).to.eql(testObject);
            });

            it('should retrieve an array', () => {
                const storageKey = 'test-key-retrieve-array';

                window.sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(testArray),
                );

                const vault = createVault<Dictionary<string>[]>(
                    storageKey,
                    VaultKind.SessionStorage
                );

                const retrievedItem = vault.retrieve();

                expect(retrievedItem).to.eql(testArray);
            });

            it('should retrieve a string', () => {
                const storageKey = 'test-key-retrieve-string';

                window.sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(testString),
                );

                const vault = createVault<string>(storageKey, VaultKind.SessionStorage);

                const retrievedItem = vault.retrieve();

                expect(retrievedItem).to.eql(testString);
            });

            it('should retrieve an number', () => {
                const storageKey = 'test-key-retrieve-number';

                window.sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(testNumber),
                );

                const vault = createVault<number>(storageKey, VaultKind.SessionStorage);

                const retrievedItem = vault.retrieve();

                expect(retrievedItem).to.eql(testNumber);
            });
        });

        describe('#purge', () => {
            it('should purge an object', () => {
                const storageKey = 'test-key-purge-object';

                window.sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(testObject),
                );

                const vault = createVault<Dictionary<Dictionary<string>>>(
                    storageKey,
                    VaultKind.SessionStorage
                );

                vault.purge();

                expect(vault.contents).to.equal(null);
                expect(window.sessionStorage.getItem(storageKey)).to.equal(
                    null,
                );
            });

            it('should purge an array', () => {
                const storageKey = 'test-key-retrieve-array';

                window.sessionStorage.setItem(
                    storageKey,
                    JSON.stringify(testArray),
                );

                const vault = createVault<Dictionary<string>[]>(
                    storageKey,
                    VaultKind.SessionStorage
                );

                vault.purge();

                expect(vault.contents).to.equal(null);
                expect(window.sessionStorage.getItem(storageKey)).to.equal(
                    null,
                );
            });
        });
    });

    describe('LocalStorageVault', () => {
        afterEach(() => {
            window.localStorage.clear();
        });

        describe('#store', () => {
            it('should store an object', () => {
                const storageKey = 'test-key-store-object';

                const vault = createVault<Dictionary<Dictionary<string>>>(
                    storageKey,
                    VaultKind.LocalStorage
                );

                vault.store(testObject);

                expect(vault.contents).to.equal(testObject);
                expect(window.localStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testObject),
                );
            });

            it('should store an array', () => {
                const storageKey = 'test-key-store-array';

                const vault = createVault<Dictionary<string>[]>(
                    storageKey,
                    VaultKind.LocalStorage
                );

                vault.store(testArray);

                expect(vault.contents).to.equal(testArray);
                expect(window.localStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testArray),
                );
            });

            it('should store a string', () => {
                const storageKey = 'test-key-store-array';

                const vault = createVault<string>(storageKey, VaultKind.LocalStorage);

                vault.store(testString);

                expect(vault.contents).to.equal(testString);
                expect(window.localStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testString),
                );
            });

            it('should store a number', () => {
                const storageKey = 'test-key-store-array';

                const vault = createVault<number>(storageKey, VaultKind.LocalStorage);

                vault.store(testNumber);

                expect(vault.contents).to.equal(testNumber);
                expect(window.localStorage.getItem(storageKey)).to.equal(
                    JSON.stringify(testNumber),
                );
            });
        });

        describe('#retrieve', () => {
            it('should retrieve an object', () => {
                const storageKey = 'test-key-retrieve-object';

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(testObject),
                );

                const vault = createVault<Dictionary<Dictionary<string>>>(
                    storageKey,
                    VaultKind.LocalStorage
                );

                const retrievedItem = vault.retrieve();

                // We are storing a simple object, so we are not doing a
                // deep equals, merely making sure the two objects
                // match
                expect(retrievedItem).to.eql(testObject);
            });

            it('should retrieve an array', () => {
                const storageKey = 'test-key-retrieve-array';

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(testArray),
                );

                const vault = createVault<Dictionary<string>[]>(
                    storageKey,
                    VaultKind.LocalStorage
                );

                const retrievedItem = vault.retrieve();

                expect(retrievedItem).to.eql(testArray);
            });

            it('should retrieve a string', () => {
                const storageKey = 'test-key-retrieve-string';

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(testString),
                );

                const vault = new LocalStorageVault<string>(storageKey);

                const retrievedItem = vault.retrieve();

                expect(retrievedItem).to.eql(testString);
            });

            it('should retrieve an number', () => {
                const storageKey = 'test-key-retrieve-number';

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(testNumber),
                );

                const vault = new LocalStorageVault<number>(storageKey);

                const retrievedItem = vault.retrieve();

                expect(retrievedItem).to.eql(testNumber);
            });
        });

        describe('#purge', () => {
            it('should purge an object', () => {
                const storageKey = 'test-key-purge-object';

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(testObject),
                );

                const vault = new LocalStorageVault<
                    Dictionary<Dictionary<string>>
                >(storageKey);

                vault.purge();

                expect(vault.contents).to.equal(null);
                expect(window.localStorage.getItem(storageKey)).to.equal(null);
            });

            it('should purge an array', () => {
                const storageKey = 'test-key-retrieve-array';

                window.localStorage.setItem(
                    storageKey,
                    JSON.stringify(testArray),
                );

                const vault = new LocalStorageVault<Dictionary<string>[]>(
                    storageKey,
                );

                vault.purge();

                expect(vault.contents).to.equal(null);
                expect(window.localStorage.getItem(storageKey)).to.equal(null);
            });
        });
    });

    // This is an example of how to use Vault for Batch Persistence so that we can verify
    // sequencing and use cases specific to batches
    describe('Batch Vault', () => {
        afterEach(() => {
            window.localStorage.clear();
        });

        it('should store and retrieve batches in the order they were added', () => {
            const storageKey = 'test-batch-save-order';

            const batch1: Partial<Batch> = {
                mpid: 'mpid-1',
                source_request_id: 'source-request-id-1',
            };

            const batch2: Partial<Batch> = {
                mpid: 'mpid-2',
                source_request_id: 'source-request-id-2',
            };

            const batch3: Partial<Batch> = {
                mpid: 'mpid-3',
                source_request_id: 'source-request-id-3',
            };

            const batch4: Partial<Batch> = {
                mpid: 'mpid-4',
                source_request_id: 'source-request-id-4',
            };

            const batch5: Partial<Batch> = {
                mpid: 'mpid-5',
                source_request_id: 'source-request-id-5',
            };

            const vault = createVault<Partial<Batch>[]>(
                storageKey,
                VaultKind.LocalStorage
            );

            vault.store([batch1, batch2, batch3, batch4, batch5]);

            expect(vault.contents[0]).to.eql(batch1);
            expect(vault.contents[1]).to.eql(batch2);
            expect(vault.contents[2]).to.eql(batch3);
            expect(vault.contents[3]).to.eql(batch4);
            expect(vault.contents[4]).to.eql(batch5);

            expect(vault.retrieve()[0]).to.eql(batch1);
            expect(vault.retrieve()[1]).to.eql(batch2);
            expect(vault.retrieve()[2]).to.eql(batch3);
            expect(vault.retrieve()[3]).to.eql(batch4);
            expect(vault.retrieve()[4]).to.eql(batch5);

            expect(window.localStorage.getItem(storageKey)).to.equal(
                JSON.stringify([batch1, batch2, batch3, batch4, batch5]),
            );
        });
    });
});
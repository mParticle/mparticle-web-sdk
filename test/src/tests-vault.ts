import { Batch } from '@mparticle/event-models';
import { expect } from 'chai';
import { Dictionary } from '../../src/utils';
import Vault from '../../src/vault';

describe('Vault', () => {
    afterEach(() => {
        window.localStorage.clear();
    });

    describe('#store', () => {
        it('should store an object', () => {
            const storageKey = 'test-key-store-object';

            const dict: Dictionary<Dictionary<string>> = {
                foo: { foo: 'bar', buzz: 'bazz' },
                pinky: { narf: 'poit' },
            };

            const vault = new Vault<Dictionary<Dictionary<string>>>(storageKey);

            vault.store(dict);

            expect(vault.contents).to.equal(dict);
            expect(window.localStorage.getItem(storageKey)).to.equal(
                JSON.stringify(dict)
            );
        });

        it('should store an array', () => {
            const storageKey = 'test-key-store-array';

            const array: Dictionary<string>[] = [
                { foo: 'bar', buzz: 'bazz' },
                { narf: 'poit' },
            ];

            const vault = new Vault<Dictionary<string>[]>(storageKey);

            vault.store(array);

            expect(vault.contents).to.equal(array);
            expect(window.localStorage.getItem(storageKey)).to.equal(
                JSON.stringify(array)
            );
        });

        it('should store batches in the order they were added', () => {
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

            const vault = new Vault<Partial<Batch>[]>(storageKey);

            vault.store([batch1, batch2, batch3, batch4, batch5]);

            expect(vault.contents[0]).to.eql(batch1);
            expect(vault.contents[1]).to.eql(batch2);
            expect(vault.contents[2]).to.eql(batch3);
            expect(vault.contents[3]).to.eql(batch4);
            expect(vault.contents[4]).to.eql(batch5);

            expect(window.localStorage.getItem(storageKey)).to.equal(
                JSON.stringify([batch1, batch2, batch3, batch4, batch5])
            );
        });
    });

    describe('#retrieve', () => {
        it('should retrieve an object', () => {
            const storageKey = 'test-key-retrieve-object';

            const dict: Dictionary<Dictionary<string>> = {
                foo: { foo: 'bar', buzz: 'bazz' },
                pinky: { narf: 'poit' },
            };

            window.localStorage.setItem(storageKey, JSON.stringify(dict));

            const vault = new Vault<Dictionary<Dictionary<string>>>(storageKey);

            const retrievedItem = vault.retrieve();

            // We are storing a simple object, so we are not doing a
            // deep equals, merely making sure the two objects
            // match
            expect(retrievedItem).to.eql(dict);
        });

        it('should retrieve an array', () => {
            const storageKey = 'test-key-retrieve-array';

            const array: Dictionary<string>[] = [
                { foo: 'bar', buzz: 'bazz' },
                { narf: 'poit' },
            ];

            window.localStorage.setItem(storageKey, JSON.stringify(array));

            const vault = new Vault<Dictionary<string>[]>(storageKey);

            const retrievedItem = vault.retrieve();

            expect(retrievedItem).to.eql(array);
        });
    });

    describe('#purge', () => {
        it('should purge an object', () => {
            const storageKey = 'test-key-purge-object';

            const dict: Dictionary<Dictionary<string>> = {
                foo: { foo: 'bar', buzz: 'bazz' },
                pinky: { narf: 'poit' },
            };

            window.localStorage.setItem(storageKey, JSON.stringify(dict));

            const vault = new Vault<Dictionary<Dictionary<string>>>(storageKey);

            vault.purge();

            expect(vault.contents).to.equal(null);
            expect(window.localStorage.getItem(storageKey)).to.equal(null);
        });

        it('should purge an array', () => {
            const storageKey = 'test-key-retrieve-array';

            const array: Dictionary<string>[] = [
                { foo: 'bar', buzz: 'bazz' },
                { narf: 'poit' },
            ];

            window.localStorage.setItem(storageKey, JSON.stringify(array));

            const vault = new Vault<Dictionary<string>[]>(storageKey);

            vault.purge();

            expect(vault.contents).to.equal(null);
            expect(window.localStorage.getItem(storageKey)).to.equal(null);
        });
    });
});

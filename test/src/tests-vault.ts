import { Batch } from '@mparticle/event-models';
import { expect } from 'chai';
import Vault from '../../src/vault';

describe('Vault', () => {
    afterEach(() => {
        window.localStorage.clear();
    });

    describe('#storeItems', () => {
        it('should store an array of batches as a hashmap', () => {
            const batch1 = {
                foo: 'bar',
                source_request_id: 'item-123',
            };

            const batch2 = {
                foo: 'bar',
                source_request_id: 'item-456',
            };

            const batches = ([batch1, batch2] as unknown) as Batch[];

            const vault = new Vault<Batch>(
                'test-key-store-batches',
                'source_request_id'
            );
            vault.storeItems(batches);

            const expectedContents = { 'item-123': batch1, 'item-456': batch2 };
            expect(vault.contents).to.eql(expectedContents);
        });

        it('should update an existing batches with new events', () => {
            const batch1 = {
                foo: 'bar',
                source_request_id: 'item-123',
                events: [
                    { eventName: 'test-event-1' },
                    { eventName: 'test-event-2' },
                ],
            };

            const batch2 = {
                foo: 'bar',
                source_request_id: 'item-456',
                events: [{ eventName: 'test-event-3' }],
            };

            const batches = ([batch1, batch2] as unknown) as Batch[];

            const vault = new Vault<Batch>(
                'test-key-store-batches',
                'source_request_id'
            );
            vault.storeItems(batches);

            batch1.events.push({ eventName: 'test-event-4' });
            batch2.events.push({ eventName: 'test-event-5' });

            vault.storeItems(batches);

            const expectedContents = {
                'item-123': {
                    foo: 'bar',
                    source_request_id: 'item-123',
                    events: [
                        { eventName: 'test-event-1' },
                        { eventName: 'test-event-2' },
                        { eventName: 'test-event-4' },
                    ],
                },
                'item-456': {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            };

            expect(vault.contents['item-123']).to.eql(
                expectedContents['item-123']
            );

            expect(vault.contents['item-456']).to.eql(
                expectedContents['item-456']
            );
        });
    });

    describe('#retrieveItems', () => {
        it('returns all batches from local storage', () => {
            const batches = {
                'item-123': {
                    foo: 'bar',
                    source_request_id: 'item-123',
                    events: [
                        { eventName: 'test-event-1' },
                        { eventName: 'test-event-2' },
                        { eventName: 'test-event-4' },
                    ],
                },
                'item-456': {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            };

            window.localStorage.setItem(
                'test-key-retrieve-batches',
                JSON.stringify(batches)
            );

            const vault = new Vault<Batch>(
                'test-key-retrieve-batches',
                'source_request_id'
            );

            const actualBatches = vault.retrieveItems();

            const expectedBatches = [
                {
                    foo: 'bar',
                    source_request_id: 'item-123',
                    events: [
                        { eventName: 'test-event-1' },
                        { eventName: 'test-event-2' },
                        { eventName: 'test-event-4' },
                    ],
                },
                {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            ];

            expect(actualBatches).to.eql(expectedBatches);
        });

        it('returns an empty array if no batches exist in local storage', () => {
            const vault = new Vault<Batch>(
                'test-key-retrieve-batches',
                'source_request_id'
            );

            expect(vault.retrieveItems()).to.eql([]);
        });
    });

    describe('#removeItem', () => {
        it('should remove a batch using source_request_id', () => {
            const batches = {
                'item-123': {
                    foo: 'bar',
                    source_request_id: 'item-123',
                    events: [
                        { eventName: 'test-event-1' },
                        { eventName: 'test-event-2' },
                        { eventName: 'test-event-4' },
                    ],
                },
                'item-456': {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            };

            window.localStorage.setItem(
                'test-key-remove-batches',
                JSON.stringify(batches)
            );

            const vault = new Vault<Batch>(
                'test-key-remove-batches',
                'source_request_id'
            );

            vault.removeItem('item-123');

            expect(vault.contents).to.eql({
                'item-456': {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            });
        });
    });

    describe('#purge', () => {
        it('should remove all items from local storage', () => {
            const batches = {
                'item-123': {
                    foo: 'bar',
                    source_request_id: 'item-123',
                    events: [
                        { eventName: 'test-event-1' },
                        { eventName: 'test-event-2' },
                        { eventName: 'test-event-4' },
                    ],
                },
                'item-456': {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            };

            window.localStorage.setItem(
                'test-key-purge',
                JSON.stringify(batches)
            );

            const vault = new Vault<Batch>(
                'test-key-purge',
                'source_request_id'
            );
            vault.purge();

            expect(vault.contents).to.eql({});
            expect(window.localStorage.getItem('test-key-purge')).to.equal(
                null
            );
        });

        it('should not affect other items in local storage', () => {
            const batches = {
                'item-123': {
                    foo: 'bar',
                    source_request_id: 'item-123',
                    events: [
                        { eventName: 'test-event-1' },
                        { eventName: 'test-event-2' },
                        { eventName: 'test-event-4' },
                    ],
                },
                'item-456': {
                    foo: 'bar',
                    source_request_id: 'item-456',
                    events: [
                        { eventName: 'test-event-3' },
                        { eventName: 'test-event-5' },
                    ],
                },
            };

            window.localStorage.setItem(
                'test-key-purge',
                JSON.stringify(batches)
            );

            window.localStorage.setItem(
                'test-key-other-items',
                'this data should not be purged'
            );

            const vault = new Vault<Batch>(
                'test-key-purge',
                'source_request_id'
            );
            vault.purge();

            expect(window.localStorage.getItem('test-key-purge')).to.equal(
                null
            );
            expect(
                window.localStorage.getItem('test-key-other-items')
            ).to.equal('this data should not be purged');
        });
    });
});

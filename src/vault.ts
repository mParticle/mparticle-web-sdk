import { Batch } from '@mparticle/event-models';
import { Dictionary, isEmpty } from './utils';

export default class Vault {
    // TODO: Make this generic
    public contents: Dictionary<Batch>;

    constructor(public key: string) {
        this.key = key;
        this.contents = this.getItems();
    }

    /**
     * Stores Batches using `source_request_id` as an index
     * @method storeBatches
     * @param {Batches[]} batches an Array of Batches
     */
    storeBatches(batches: Batch[]): void {
        this.contents = this.getItems() || {};

        batches.forEach(batch => {
            if (batch.source_request_id) {
                this.contents[batch.source_request_id] = batch;
            }
        });

        this.saveItems(this.contents);
    }

    /**
     * Removes a single batch based on `source_request_id`
     * @method removeBatch
     * @param {String} source_request_id
     */
    removeBatch(source_request_id: string): void {
        this.contents = this.getItems() || {};

        delete this.contents[source_request_id];

        this.saveItems<Batch>(this.contents);
    }

    /**
     * Retrieves all batches from local storage as an array
     * @method retrieveBatches
     * @returns {Batch[]} a list of Batches
     */
    retrieveBatches(): Batch[] {
        this.contents = this.getItems() || {};

        return Object.keys(this.contents).map(item => this.contents[item]);
    }

    /**
     * Removes all persisted data from local storage based on this vault's `key`
     * @method purge
     */
    purge(): void {
        this.contents = {};
        this.removeItems();
    }

    private saveItems<T>(items: Dictionary<T>): void {
        try {
            window.localStorage.setItem(
                this.key,
                !isEmpty(items) ? JSON.stringify(items) : ''
            );
        } catch (err) {
            console.error('Cannot Save Items to Local Storage', err);
        }
    }

    private getItems<T>(): Dictionary<T> {
        const itemString = window.localStorage.getItem(this.key);

        return itemString ? JSON.parse(itemString) : {};
    }

    private removeItems(): void {
        window.localStorage.removeItem(this.key);
    }
}

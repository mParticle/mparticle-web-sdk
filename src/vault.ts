import { Dictionary, isEmpty } from './utils';

export default class Vault<StorableItem extends Dictionary> {
    public contents: Dictionary<StorableItem>;
    private readonly _storageKey: string;
    private readonly _itemKey: keyof StorableItem;

    constructor(storageKey: string, itemKey: keyof StorableItem) {
        this._storageKey = storageKey;
        this._itemKey = itemKey;
        this.contents = this.getItems();
    }

    /**
     * Stores Items using `itemId` as an index
     * @method storeItems
     * @param {StorableItem[]} an Array of StorableItems
     */
    public storeItems(items: StorableItem[]): void {
        this.contents = this.getItems();

        items.forEach(item => {
            if (item[this._itemKey]) {
                this.contents[item[this._itemKey]] = item;
            }
        });

        this.saveItems(this.contents);
    }

    /**
     * Removes a single StorableItem based on `indexId`
     * @method removeItem
     * @param {String} indexId
     */
    public removeItem(indexId: string): void {
        this.contents = this.getItems() || {};

        try {
            delete this.contents[indexId];

            this.saveItems(this.contents);
        } catch (e) {
            console.error('Unable to remove item without a matching ID', e);
        }
    }

    /**
     * Retrieves all StorableItems from local storage as an array
     * @method retrieveItems
     * @returns {StorableItem[]} an array of Batches
     */
    public retrieveItems(): StorableItem[] {
        this.contents = this.getItems();

        return Object.keys(this.contents).map(item => this.contents[item]);
    }

    /**
     * Removes all persisted data from local storage based on this vault's `key`
     * @method purge
     */
    public purge(): void {
        this.contents = {};
        this.removeItems();
    }

    private saveItems(items: Dictionary<StorableItem>): void {
        try {
            window.localStorage.setItem(
                this._storageKey,
                !isEmpty(items) ? JSON.stringify(items) : ''
            );
        } catch (err) {
            console.error('Cannot Save Items to Local Storage', err);
        }
    }

    private getItems(): Dictionary<StorableItem> {
        // TODO: return contents if local storage is unavailable?
        const itemString = window.localStorage.getItem(this._storageKey);

        return itemString ? JSON.parse(itemString) : {};
    }

    private removeItems(): void {
        window.localStorage.removeItem(this._storageKey);
    }
}

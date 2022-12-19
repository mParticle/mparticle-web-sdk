import { Logger } from '@mparticle/web-sdk';
import { Dictionary, isEmpty } from './utils';

interface IVaultOptions {
    logger?: Logger;
}

export default class Vault<StorableItem extends Dictionary> {
    public contents: Dictionary<StorableItem>;
    private readonly _storageKey: string;
    private readonly _itemKey: keyof StorableItem;
    private logger?: Logger | undefined;

    constructor(
        storageKey: string,
        itemKey: keyof StorableItem,
        options?: IVaultOptions
    ) {
        this._storageKey = storageKey;
        this._itemKey = itemKey;
        this.contents = this.getItems();

        // Add a fake logger in case one is not provided or needed
        this.logger = options?.logger || {
            verbose: ()=> {}
        };
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
                this.logger.verbose(`Saved items to vault with key: ${item[this._itemKey]}`);
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
        this.logger.verbose(`Removing from vault: ${indexId}`);
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
     * @returns {StorableItem[]} an array of Items 
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

import { Logger } from '@mparticle/web-sdk';
import { Dictionary, isEmpty } from './utils';

interface IVaultOptions {
    logger?: Logger;
    offlineStorageEnabled?: boolean;
}

export default class Vault<StorableItem extends Dictionary> {
    public contents: Dictionary<StorableItem>;
    private readonly _storageKey: string;
    private readonly _itemKey: keyof StorableItem;
    private logger?: Logger;
    private offlineStorageEnabled: boolean = false;

    /**
     *
     * @param {string} storageKey the local storage key string
     * @param {string} itemKey an element within your StorableItem to use as a key
     * @param {IVaultOptions} options A Dictionary of IVaultOptions
     */
    constructor(
        storageKey: string,
        itemKey: keyof StorableItem,
        options?: IVaultOptions
    ) {
        this._storageKey = storageKey;
        this._itemKey = itemKey;
        this.contents = this.getItems() || {};

        this.offlineStorageEnabled = options?.offlineStorageEnabled;

        // Add a fake logger in case one is not provided or needed
        this.logger = options?.logger || {
            verbose: () => {},
            warning: () => {},
            error: () => {},
        };
    }

    /**
     * Stores a single Item using `itemId` as an index
     * @method storeItem
     * @param item {StorableItem} a Dictonary with key to store
     */
    public storeItem(item: StorableItem): void {
        this.contents = this.getItems();

        if (item[this._itemKey]) {
            this.contents[item[this._itemKey]] = item;
            this.logger.verbose(
                `Saved items to vault with key: ${item[this._itemKey]}`
            );
        }

        this.saveItems(this.contents);
    }

    /**
     * Stores Items using `itemId` as an index
     * @method storeItems
     * @param {StorableItem[]} an Array of StorableItems
     */
    public storeItems(items: StorableItem[]): void {
        items.forEach((item) => this.storeItem(item));
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
        } catch (error) {
            this.logger.error(
                `Unable to remove item without a matching ID ${indexId}`
            );
            this.logger.error(error as string);
        }
    }

    /**
     * Retrieves all StorableItems from local storage as an array
     * @method retrieveItems
     * @returns {StorableItem[]} an array of Items
     */
    public retrieveItems(): StorableItem[] {
        this.contents = this.getItems();

        return Object.keys(this.contents).map((item) => this.contents[item]);
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
        if (!this.offlineStorageEnabled) {
            return;
        }
        try {
            window.localStorage.setItem(
                this._storageKey,
                !isEmpty(items) ? JSON.stringify(items) : ''
            );
        } catch (error) {
            this.logger.error(`Cannot Save items to Local Storage: ${items}`);
            this.logger.error(error as string);
        }
    }

    private getItems(): Dictionary<StorableItem> {
        if (!this.offlineStorageEnabled) {
            return this.contents;
        }
        // TODO: Handle cases where Local Storage is unavailable
        // https://go.mparticle.com/work/SQDSDKS-5022
        const itemString = window.localStorage.getItem(this._storageKey);

        return itemString ? JSON.parse(itemString) : {};
    }

    private removeItems(): void {
        if (!this.offlineStorageEnabled) {
            return;
        }
        window.localStorage.removeItem(this._storageKey);
    }
}
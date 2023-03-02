import { Logger } from '@mparticle/web-sdk';
import { Dictionary, isEmpty } from './utils';

interface IVaultOptions {
    logger?: Logger;
    offlineStorageEnabled?: boolean;
}

export default class Vault<StorableItem> {
    public contents: StorableItem;
    private readonly _storageKey: string;
    private logger?: Logger;

    /**
     *
     * @param {string} storageKey the local storage key string
     * @param {string} itemKey an element within your StorableItem to use as a key
     * @param {IVaultOptions} options A Dictionary of IVaultOptions
     */
    constructor(storageKey: string, options?: IVaultOptions) {
        this._storageKey = storageKey;
        this.contents = this.getFromLocalStorage();

        // Add a fake logger in case one is not provided or needed
        this.logger = options?.logger || {
            verbose: () => {},
            warning: () => {},
            error: () => {},
        };
    }

    /**
     * Stores a StorableItem to Local Storage
     * @method storeItem
     * @param item {StorableItem}
     */
    public store(item: StorableItem): void {
        this.contents = item;

        this.logger.verbose(`Saved to local storage: ${item}`);

        this.saveToLocalStorage(this.contents);
    }

    /**
     * Retrieves all StorableItems from local storage as an array
     * @method retrieveItems
     * @returns {StorableItem[]} an array of Items
     */
    public retrieve(): StorableItem {
        this.contents = this.getFromLocalStorage();

        return this.contents;
    }

    /**
     * Removes all persisted data from local storage based on this vault's `key`
     * @method purge
     */
    public purge(): void {
        this.contents = null;
        this.removeFromLocalStorage();
    }

    private saveToLocalStorage(items: StorableItem): void {
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

    private getFromLocalStorage(): StorableItem | null {
        // TODO: Handle cases where Local Storage is unavailable
        // https://go.mparticle.com/work/SQDSDKS-5022
        const item = window.localStorage.getItem(this._storageKey);

        return item ? JSON.parse(item) : null;
    }

    private removeFromLocalStorage(): void {
        window.localStorage.removeItem(this._storageKey);
    }
}

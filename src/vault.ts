import { isEmpty, isNumber } from './utils';

export abstract class BaseVault<StorableItem> {
    public contents: StorableItem;
    protected readonly _storageKey: string;
    protected storageObject: Storage;

    /**
     *
     * @param {string} storageKey the local storage key string
     * @param {Storage} storageObject Web API Storage object that is being used
     */
    constructor(
        storageKey: string,
        storageObject: Storage
    ) {
        this._storageKey = storageKey;
        this.storageObject = storageObject;

        this.contents = this.retrieve();
    }

    /**
     * Stores a StorableItem to Storage
     * @method store
     * @param item {StorableItem}
     */
    public store(item: StorableItem): void {
        let stringifiedItem: string;
        this.contents = item;

        if (isNumber(item) || !isEmpty(item)) {
            stringifiedItem = JSON.stringify(item);
        } else {
            stringifiedItem = '';
        }

        try {
            this.storageObject.setItem(this._storageKey, stringifiedItem);
        } catch (error) {
            console.error('Cannot Save items to Storage');
        }
    }

    /**
     * Retrieve StorableItem from Storage
     * @method retrieve
     * @returns {StorableItem}
     */
    public retrieve(): StorableItem | null {
        // TODO: Handle cases where Local Storage is unavailable
        // https://go.mparticle.com/work/SQDSDKS-5022
        const item: string = this.storageObject.getItem(this._storageKey);

        this.contents = item ? JSON.parse(item) : null;

        return this.contents;
    }

    /**
     * Removes all persisted data from Storage based on this vault's `key`
     * Will remove storage key from Storage as well
     * @method purge
     */
    public purge(): void {
        this.contents = null;
        this.storageObject.removeItem(this._storageKey);
    }
}

export class LocalStorageVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string) {
        super(storageKey, window.localStorage);
    }
}

export class SessionStorageVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string) {
        super(storageKey, window.sessionStorage);
    }
}
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
    public store(item: StorableItem): boolean {
        let stringifiedItem: string;

        try {
            if (isNumber(item) || !isEmpty(item)) {
                stringifiedItem = JSON.stringify(item);
            } else {
                stringifiedItem = '';
            }

            this.storageObject.setItem(this._storageKey, stringifiedItem);
            this.contents = item;
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Retrieve StorableItem from Storage
     * @method retrieve
     * @returns {StorableItem}
     */
    public retrieve(): StorableItem | null {
        // https://go.mparticle.com/work/SQDSDKS-5022
        try {
            const item: string = this.storageObject.getItem(this._storageKey);

            this.contents = item ? JSON.parse(item) : null;
        } catch (e) {
            this.contents = null;
        }

        return this.contents;
    }

    /**
     * Removes all persisted data from Storage based on this vault's `key`
     * Will remove storage key from Storage as well
     * @method purge
     */
    public purge(): void {
        this.contents = null;

        try {
            this.storageObject.removeItem(this._storageKey);
        } catch (e) {
            // Storage persistence is best effort.
        }
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

// DisabledVault is used when persistence is disabled by privacy flags.
export class DisabledVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string) {
        super(storageKey, window.localStorage);
        this.contents = null;
        this.storageObject.removeItem(this._storageKey);
    }

    public store(_item: StorableItem): boolean {
        this.contents = null;
        return true;
    }

    public retrieve(): StorableItem | null {
        return this.contents;
    }

    public purge(): void {
        this.contents = null;
    }
}

import { Logger } from '@mparticle/web-sdk';
import { isEmpty, isNumber } from './utils';

export interface IVaultOptions {
    logger?: Logger;
    offlineStorageEnabled?: boolean;
}

export abstract class BaseVault<StorableItem> {
    public contents: StorableItem;
    protected readonly _storageKey: string;
    protected logger?: Logger;
    protected storageObject: Storage;

    /**
     *
     * @param {string} storageKey the local storage key string
     * @param {Storage} Web API Storage object that is being used
     * @param {IVaultOptions} options A Dictionary of IVaultOptions
     */
    constructor(
        storageKey: string,
        storageObject: Storage,
        options?: IVaultOptions
    ) {
        this._storageKey = storageKey;
        this.storageObject = storageObject;

        // Add a fake logger in case one is not provided or needed
        this.logger = options?.logger || {
            verbose: () => {},
            warning: () => {},
            error: () => {},
        };

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

            this.logger.verbose(`Saving item to Storage: ${stringifiedItem}`);
        } catch (error) {
            this.logger.error(
                `Cannot Save items to Storage: ${stringifiedItem}`
            );
            this.logger.error(error as string);
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

        this.logger.verbose(`Retrieving item from Storage: ${item}`);

        return this.contents;
    }

    /**
     * Removes all persisted data from Storage based on this vault's `key`
     * Will remove storage key from Storage as well
     * @method purge
     */
    public purge(): void {
        this.logger.verbose('Purging Storage');
        this.contents = null;
        this.storageObject.removeItem(this._storageKey);
    }
}

export class LocalStorageVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string, options?: IVaultOptions) {
        super(storageKey, window.localStorage, options);
    }
}

export class SessionStorageVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string, options?: IVaultOptions) {
        super(storageKey, window.sessionStorage, options);
    }
}

// DisabledVault is used when persistence is disabled by privacy flags.
export class DisabledVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string, options?: IVaultOptions) {
        super(storageKey, window.localStorage, options);
        this.contents = null;
    }

    public store(_item: StorableItem): void {
        this.contents = null;
    }

    public retrieve(): StorableItem | null {
        this.contents = null;
        return null;
    }

    public purge(): void {
        this.contents = null;
        try {
            window.localStorage.removeItem(this._storageKey);
        } catch {}
    }
}
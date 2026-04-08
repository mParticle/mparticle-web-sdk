export declare abstract class BaseVault<StorableItem> {
    contents: StorableItem;
    protected readonly _storageKey: string;
    protected storageObject: Storage;
    /**
     *
     * @param {string} storageKey the local storage key string
     * @param {Storage} storageObject Web API Storage object that is being used
     */
    constructor(storageKey: string, storageObject: Storage);
    /**
     * Stores a StorableItem to Storage
     * @method store
     * @param item {StorableItem}
     */
    store(item: StorableItem): void;
    /**
     * Retrieve StorableItem from Storage
     * @method retrieve
     * @returns {StorableItem}
     */
    retrieve(): StorableItem | null;
    /**
     * Removes all persisted data from Storage based on this vault's `key`
     * Will remove storage key from Storage as well
     * @method purge
     */
    purge(): void;
}
export declare class LocalStorageVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string);
}
export declare class SessionStorageVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string);
}
export declare class DisabledVault<StorableItem> extends BaseVault<StorableItem> {
    constructor(storageKey: string);
    store(_item: StorableItem): void;
    retrieve(): StorableItem | null;
    purge(): void;
}

import { IKitFilterSettings } from './configAPIClient';
import type KitBlocker from './kitBlocking';
export type ButtonClickBlocker = 'data plan' | 'forwarding rule' | 'event name filter' | 'event type filter';
export declare const getButtonClickBlocker: (forwarder: IKitFilterSettings, kitBlocker?: KitBlocker, link?: boolean) => ButtonClickBlocker | undefined;

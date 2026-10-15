import { IMParticleWebSDKInstance } from './mp-instance';
export interface IForwardingStatsUploader {
    startForwardingStatsTimer(): void;
}
export default function forwardingStatsUploader(this: IForwardingStatsUploader, mpInstance: IMParticleWebSDKInstance): void;

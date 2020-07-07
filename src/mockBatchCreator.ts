// This file is used ONLY for the mParticle ESLint plugin. It should NOT be used otherwise!

import ServerModel from './serverModel';
import { SDKEvent, BaseEvent, MParticleWebSDK } from './sdkRuntimeModels';
import { convertEvents } from './sdkToEventsApiConverter';
import * as EventsApi from '@mparticle/event-models';
export default class _BatchValidator {
    private getMPInstance() {
        return {
            // Certain Helper, Store, and Identity properties need to be mocked to be used in the `returnBatch` method
            _Helpers: {
                sanitizeAttributes: window.mParticle.getInstance()._Helpers
                    .sanitizeAttributes,
                generateUniqueId: function() {
                    return 'mockId';
                },
                extend: window.mParticle.getInstance()._Helpers.extend,
            },
            _Store: {
                sessionId: 'mockSessionId',
                SDKConfig: {},
            },
            Identity: {
                getCurrentUser: function() {
                    return null;
                },
            },
            getAppVersion: function() {
                return null;
            },
            getAppName: function() {
                return null;
            },
        };
    }

    returnBatch(event: BaseEvent) {
        const mpInstance = this.getMPInstance();
        const sdkEvent: SDKEvent = new ServerModel(
            mpInstance
        ).createEventObject(event);
        const batch: EventsApi.Batch | null = convertEvents(
            '0',
            [sdkEvent],
            mpInstance as any
        );
        return batch;
    }
}

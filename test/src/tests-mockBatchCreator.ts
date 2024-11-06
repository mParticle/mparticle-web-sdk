import _BatchValidator from '../../src/mockBatchCreator';
import { BaseEvent } from '../../src/sdkRuntimeModels';
import { expect } from 'chai';

describe('Create a batch from a base event', () => {
    const baseEvent: BaseEvent = {
        messageType: 4,
        name: 'testEvent'
    }

    it('creates a batch with base event ', done => {
        const now = new Date().getTime();
        const batchValidator = new _BatchValidator()

        let batch = batchValidator.returnBatch(baseEvent);

        expect(batch).to.have.property('environment').equal('production');
        expect(batch).to.have.property('source_request_id').equal('mockId');
        expect(batch).to.have.property('mpid').equal('0');
        expect(batch).to.have.property('timestamp_unixtime_ms').greaterThanOrEqual(now);
        expect(batch).to.have.property('mp_deviceid');
        expect(batch).to.have.property('sdk_version')
        expect(batch).to.have.property('application_info');
        expect(batch).to.have.property('device_info');
        expect(batch).to.have.property('user_attributes');
        expect(batch).to.have.property('user_identities');
        expect(batch).to.have.property('consent_state');
        expect(batch).to.have.property('integration_attributes');
        expect(batch).to.have.property('events');

        expect(batch.events[0]).to.have.property('event_type', 'custom_event');
        expect(batch.events[0]).to.have.property('data');
        expect(batch.events[0].data).to.have.property('custom_event_type', 'unknown');
        expect(batch.events[0].data).to.have.property('custom_flags');
        expect(batch.events[0].data).to.have.property('event_name', 'testEvent');
        expect(batch.events[0].data).to.have.property('timestamp_unixtime_ms');
        expect(batch.events[0].data).to.have.property('session_uuid', 'mockSessionId');
        expect(batch.events[0].data).to.have.property('session_start_unixtime_ms');
        expect(batch.events[0].data).to.have.property('custom_attributes');
        expect(batch.events[0].data).to.have.property('location');


        baseEvent.eventType = 1;
        batch = batchValidator.returnBatch(baseEvent);
        expect(batch.events[0].data).to.have.property('custom_event_type', 'navigation');


        baseEvent.data = { attrFoo: 'attrBar' };
        batch = batchValidator.returnBatch(baseEvent);
        expect(batch.events[0].data).to.have.property('custom_attributes');
        expect(batch.events[0].data.custom_attributes).to.have.property('attrFoo', 'attrBar');

        baseEvent.customFlags = { flagFoo: 'flagBar' }
        batch = batchValidator.returnBatch(baseEvent);
        expect(batch.events[0].data).to.have.property('custom_flags');
        expect(batch.events[0].data.custom_flags).to.have.property('flagFoo', 'flagBar');

        done();
    });

    [undefined, null, false, true].forEach(omitBatchTimestamp => {
        it(`respects an omitBatchTimestamp config value of ${omitBatchTimestamp}`, done => {
            const now = new Date().getTime();
            const batchValidator = new _BatchValidator({
                configOverride: {omitBatchTimestamp}
            });

            const batch = batchValidator.returnBatch(baseEvent);

            if (omitBatchTimestamp) {
                expect(batch).to.have.property('timestamp_unixtime_ms', null);
            } else {
                expect(batch).to.have.property('timestamp_unixtime_ms').greaterThanOrEqual(now);
            }

            done();
        });
    })

    it(`can use a batch timestamp override value`, done => {
        const oneDayAgo = new Date().getTime() - (24 * 3600 * 1000);
        const batchValidator = new _BatchValidator({
            storeOverride: {batchTimestampUnixtimeMsOverride: oneDayAgo}
        });
        const batch = batchValidator.returnBatch(baseEvent);

        expect(batch).to.have.property('timestamp_unixtime_ms').greaterThanOrEqual(oneDayAgo);

        done();
    });

    it(`a batch timestamp override takes precedence over the sdk config`, done => {
        const oneDayAgo = new Date().getTime() - (24 * 3600 * 1000);
        const batchValidator = new _BatchValidator({
            configOverride: {omitBatchTimestamp: true},
            storeOverride: {batchTimestampUnixtimeMsOverride: oneDayAgo}}
        );
        const batch = batchValidator.returnBatch(baseEvent);

        expect(batch).to.have.property('timestamp_unixtime_ms').greaterThanOrEqual(oneDayAgo);

        done();
    });
});
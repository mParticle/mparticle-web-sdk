// import sinon from 'sinon';
// import { expect } from 'chai';
// import fetchMock from 'fetch-mock/esm/client';
// import {
//     urls,
//     apiKey,
//     testMPID,
// } from './config/constants';
// import Utils from './config/utils';
// import { IMParticleInstanceManager, SDKProduct } from '../../src/sdkRuntimeModels';
// const {
//     waitForCondition,
//     fetchMockSuccess,
//     hasIdentifyReturned, 
//     findEventFromRequest,
// } = Utils;

// declare global {
//     interface Window {
//         mParticle: IMParticleInstanceManager;
//     }
// }

// const mParticle = window.mParticle as IMParticleInstanceManager;

// describe('time on site', function() {
//     let clock;

//     beforeEach(function() {
//         fetchMockSuccess(urls.identify, {
//             mpid: testMPID, is_logged_in: false
//         });
        
//         fetchMock.post(urls.events, 200);

//         mParticle.init(apiKey, window.mParticle.config);
//     });

//     afterEach(function() {
//         clock.restore();
//         fetchMock.restore();
//     });

//     it.only('should increment the active_time_on_site by the appropriate amount in between events', async function() {
//         clock = sinon.useFakeTimers()
//         await waitForCondition(hasIdentifyReturned)
//         await clock.tickAsync(1000);
//         // clock.tick(1000);
        
//         // console.log(performance.now())
//         // console.log(performance.now())
//         // console.log(performance.now())
//         // console.log(performance.now())

//         // sinon.stub(performance, "now").callsFake(() => clock.now);

//         // clock.tick(1000);

//         mParticle.logEvent('foo');
        
//         const event1 = findEventFromRequest(fetchMock.calls(), 'foo');

//         const event1TOS = event1.data.active_time_on_site_ms;
//         console.log(event1TOS);
//         console.log(event1TOS);
//         console.log(event1TOS);
//         console.log(event1TOS);
//         console.log(event1TOS);
//         console.log(event1TOS);
//         clock.tick(1000);
        
//         mParticle.logEvent('foo-2');
//         const event2 = findEventFromRequest(fetchMock.calls(), 'foo-2');
//         // debugger;
//         // expect(event1.data).to.have.property('active_time_on_site_ms');
//         // expect(event2.data).to.have.property('active_time_on_site_ms');


//         const event2TOS = event2.data.active_time_on_site_ms;
//         console.log(event2TOS);

//         // expect(event2TOS - event1TOS).to.equal(1000);
//     });
// });
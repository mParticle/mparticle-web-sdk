import Constants from '../../src/constants';
import sinon from 'sinon';
import { expect } from 'chai';
import fetchMock from 'fetch-mock/esm/client';
import { urls, apiKey,
    testMPID,
    MPConfig,
} from './config/constants';
import Utils from './config/utils';
import { IMParticleInstanceManager, SDKInitConfig } from '../../src/sdkRuntimeModels';
import { IKitConfigs } from '../../src/configAPIClient';
import KitFilterHelper from '../../src/kitFilterHelper';
import { EventType, MessageType } from '../../src/types';

const { waitForCondition, fetchMockSuccess, deleteAllCookies } = Utils;

declare global {
    interface Window {
        mParticle: IMParticleInstanceManager;
    }
}

const hasIdentifyReturned = () => {
    return window.mParticle.Identity.getCurrentUser()?.getMPID() === testMPID;
};

describe('feature-flags', () => {
    describe('user audiences', () => {
        beforeEach(() => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.config.overwriteRoutes = true;
            fetchMock.post(urls.events, 200);
            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });
            window.mParticle.init(apiKey, window.mParticle.config);
        });

        afterEach(() => {
            fetchMock.restore();
            sinon.restore();
        });

        it('should not be able to access user audience API if feature flag is false', async () => {
            window.mParticle.config.flags = {
                audienceAPI: 'False'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const bond = sinon.spy(window.mParticle.getInstance().Logger, 'error');
            window.mParticle.Identity.getCurrentUser().getUserAudiences();

            bond.called.should.eql(true);
            bond.getCalls()[0].args[0].should.eql(
                Constants.Messages.ErrorMessages.AudienceAPINotEnabled
            );
        });

        it('should be able to call user audience API if feature flag is false', async () => {
            const userAudienceUrl = `https://${Constants.DefaultBaseUrls.userAudienceUrl}${apiKey}/audience`;
            const audienceMembershipServerResponse = {
                ct: 1710441407915,
                dt: 'cam',
                id: 'foo-id-2',
                audience_memberships: [
                    {
                        audience_id: 9876,
                    },
                    {
                        audience_id: 5432,
                    },
                ]
            };

            fetchMock.get(`${userAudienceUrl}?mpid=${testMPID}`, {
                status: 200,
                body: JSON.stringify(audienceMembershipServerResponse)
            });

            window.mParticle.config.flags = {
                audienceAPI: 'True'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned);

            const bond = sinon.spy(window.mParticle.getInstance().Logger, 'error');

            window.mParticle.Identity.getCurrentUser().getUserAudiences((result) => {
                    console.log(result);   
            });
            bond.called.should.eql(false);
        });
    });

    describe('capture integration specific ids', () => {
        beforeEach(() => {
            fetchMock.post(urls.events, 200);

            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });

            window.document.cookie = '_cookie1=1234';
            window.document.cookie = '_cookie2=39895811.9165333198';
            window.document.cookie = 'foo=bar';
            window.document.cookie = '_fbp=54321';
            window.document.cookie = 'baz=qux';
        });

        afterEach(() => {
            fetchMock.restore();
            deleteAllCookies();
            sinon.restore(); // Restore all stubs and spies
            deleteAllCookies();
        });

        it('should capture click ids when feature flag is true', async () => {
            window.mParticle.config.flags = {
                captureIntegrationSpecificIds: 'True',
                'captureIntegrationSpecificIds.V2': 'all'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);

            await waitForCondition(hasIdentifyReturned)

            const integrationCapture = window.mParticle.getInstance()._IntegrationCapture;
            sinon.stub(integrationCapture, 'getQueryParams').returns({ fbclid: '1234' });
            const captureSpy = sinon.spy(integrationCapture, 'capture');
            const clickIdSpy = sinon.spy(integrationCapture, 'getClickIdsAsCustomFlags');

            integrationCapture.capture();
            integrationCapture.getClickIdsAsCustomFlags();

            const initialTimestamp = integrationCapture.initialTimestamp;

            expect(initialTimestamp).to.be.a('number');
            expect(integrationCapture.clickIds).to.deep.equal({
                fbclid: `fb.1.${initialTimestamp}.1234`,
                '_fbp': '54321',
            });
            expect(captureSpy.called, 'capture()').to.equal(true);
            expect(clickIdSpy.called, 'getClickIdsAsCustomFlags').to.equal(true);
        });

        it('should NOT capture click ids when feature flag is false', async () => {
            window.mParticle.config.flags = {
                captureIntegrationSpecificIds: 'False',
                'captureIntegrationSpecificIds.V2': 'none'
            };

            // initialize mParticle with feature flag 
            window.mParticle.init(apiKey, window.mParticle.config);
            await waitForCondition(hasIdentifyReturned)

            const integrationCapture = window.mParticle.getInstance()._IntegrationCapture;
            let captureCalled = false;
            let clickIdCalled = false;
            if (integrationCapture) {
                const captureSpy = sinon.spy(integrationCapture, 'capture');
                const clickIdSpy = sinon.spy(integrationCapture, 'getClickIdsAsCustomFlags');
                captureCalled = captureSpy.called;
                clickIdCalled = clickIdSpy.called;
            }

            expect(integrationCapture && integrationCapture.clickIds).not.be.ok;
            expect(captureCalled, 'capture()').to.equal(false);
            expect(clickIdCalled, 'getClickIdsAsCustomFlags').to.equal(false);
        });
    });

    describe('auto button tracking', () => {
        const roktConfig = { name: 'Rokt', moduleId: 181 } as IKitConfigs;
        const trackerState = () => (window as any).__mpBtn__;
        const activeTracker = () => {
            const state = trackerState();
            return state ? state.tracker : undefined;
        };

        let trackerStateWrites: string[] = [];
        const lastInitStoreOwner = () => {
            const manager = window.mParticle as any;
            const owner = Object.keys(manager._instances).find(
                name => manager._instances[name]._Store === manager.Store
            );
            return owner || 'unregistered';
        };
        const writerFrames = () =>
            (new Error().stack || '')
                .split('\n')
                .filter(line => /:\d+:\d+/.test(line))
                .slice(2, 10)
                .map(line => line.trim().replace(/(@|\()?[^@(\s]*\/([^/?\s]+)(?:\?[^:\s]*)?:(\d+):\d+\)?$/, '@$2:$3'))
                .join(' < ');

        const initAndExpectTracker = (config: SDKInitConfig, instanceName?: string) => {
            window.mParticle.init(apiKey, config, instanceName);
            const store = window.mParticle.getInstance(instanceName)._Store;
            const tracker = activeTracker();
            expect(tracker, `tracker right after init (isEnabled=${store.isEnabled})`).to.not.equal(undefined);
            trackerStateWrites = [];
            return { tracker, state: trackerState(), store, instanceName };
        };

        const expectTrackerKeptThroughWait = (started: ReturnType<typeof initAndExpectTracker>) => {
            const storeNow = window.mParticle.getInstance(started.instanceName)._Store;
            const replaced = `stateReplaced=${trackerState() !== started.state}, storeReplaced=${storeNow !== started.store}`;
            const writes = trackerStateWrites.join(' | ') || 'none';
            expect(
                activeTracker(),
                `tracker after the wait (isActive=${started.tracker.isActive}, ${replaced}; state writes: ${writes})`
            ).to.equal(started.tracker);
        };

        before(() => {
            let state = trackerState();
            Object.defineProperty(window, '__mpBtn__', {
                configurable: true,
                get: () => state,
                set: value => {
                    trackerStateWrites.push(`[lastInitStore=${lastInitStoreOwner()}] ${writerFrames()}`);
                    state = value;
                },
            });
        });

        after(() => {
            const state = trackerState();
            delete (window as any).__mpBtn__;
            (window as any).__mpBtn__ = state;
        });

        beforeEach(() => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.config.overwriteRoutes = true;
            fetchMock.post(urls.events, 200);
            fetchMockSuccess(urls.identify, {
                mpid: testMPID, is_logged_in: false
            });
        });

        afterEach(() => {
            window.mParticle._resetForTests(MPConfig);
            fetchMock.restore();
            sinon.restore();
        });

        it('listens when the flag is True and a Rokt kit is configured', async () => {
            const started = initAndExpectTracker({
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);

            expectTrackerKeptThroughWait(started);
            expect(activeTracker() && activeTracker().isActive).to.equal(true);
        });

        it('does not listen when the flag is off', async () => {
            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);

            expect(activeTracker()).to.equal(undefined);
        });

        it('listens without a Rokt kit', async () => {
            const started = initAndExpectTracker(
                { ...window.mParticle.config, flags: { autoButtonTracking: 'True' } },
                'auto-button-no-rokt'
            );
            await waitForCondition(() =>
                window.mParticle.getInstance('auto-button-no-rokt')._Store.isInitialized
            );

            expectTrackerKeptThroughWait(started);
            expect(activeTracker() && activeTracker().isActive).to.equal(true);
            expect(activeTracker().hasRoktKit).to.equal(false);
        });

        it('keeps listening without the kit signal when a re-init drops the Rokt kit', async () => {
            const started = initAndExpectTracker({
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);
            expectTrackerKeptThroughWait(started);
            const earlier = activeTracker();

            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'True' },
                kitConfigs: [],
            });
            await waitForCondition(hasIdentifyReturned);

            expect(activeTracker()).to.equal(earlier);
            expect(earlier.isActive).to.equal(true);
            expect(earlier.hasRoktKit).to.equal(false);
        });

        it('drops signals buffered for the kit on opt-out', async () => {
            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);
            const roktManager = window.mParticle.getInstance()._RoktManager as any;
            roktManager.notifyCheckoutIntent({ kind: 'commit', t: Date.now() });
            expect(roktManager.pendingCheckoutIntents.length).to.equal(1);

            window.mParticle.setOptOut(true);

            expect(roktManager.pendingCheckoutIntents.length).to.equal(0);
        });

        describe('checkout intent and the Rokt connection', () => {
            const initWith = async (overrides: Partial<SDKInitConfig>) => {
                window.mParticle.init(apiKey, {
                    ...window.mParticle.config,
                    flags: { autoButtonTracking: 'True' },
                    ...overrides,
                });
                await waitForCondition(hasIdentifyReturned);
                return window.mParticle.getInstance()._RoktManager;
            };

            it('is live when the Rokt connection receives auto button clicks', async () => {
                const roktManager = await initWith({ kitConfigs: [roktConfig] });

                expect(roktManager.isCheckoutIntentLive()).to.equal(true);
            });

            it('is off when the Rokt connection filters auto button clicks by name', async () => {
                const eventNameFilters = [
                    KitFilterHelper.hashEventName('Auto Button Click', EventType.Other),
                ];
                const roktManager = await initWith({
                    kitConfigs: [{ ...roktConfig, eventNameFilters }],
                });

                expect(roktManager.isCheckoutIntentLive()).to.equal(false);
            });

            it('is off when the Rokt connection filters the Other event type', async () => {
                const eventTypeFilters = [KitFilterHelper.hashEventType(EventType.Other)];
                const roktManager = await initWith({
                    kitConfigs: [{ ...roktConfig, eventTypeFilters }],
                });

                expect(roktManager.isCheckoutIntentLive()).to.equal(false);
            });

            it('is off when the data plan blocks unplanned events and does not plan auto button clicks', async () => {
                const roktManager = await initWith({
                    kitConfigs: [roktConfig],
                    dataPlanOptions: {
                        dataPlanVersion: { version_document: { data_points: [] } },
                        blockEvents: true,
                    },
                } as Partial<SDKInitConfig>);

                expect(roktManager.isCheckoutIntentLive()).to.equal(false);
            });

            ([
                ['warns at the default log level which check turns it off', true],
                ['warns about nothing when the connection receives them', false],
            ] as Array<[string, boolean]>).forEach(([name, filtered]) => it(name, async () => {
                const warnings: string[] = [];
                const eventNameFilters = filtered
                    ? [KitFilterHelper.hashEventName('Auto Button Click', EventType.Other)]
                    : [];

                // The SDK's default level, which the shared test config turns off.
                await initWith({
                    kitConfigs: [{ ...roktConfig, eventNameFilters }],
                    logLevel: 'warning',
                    logger: { warning: (message: string) => warnings.push(message) },
                } as Partial<SDKInitConfig>);

                expect(warnings.filter(message => message.indexOf('Checkout intent is off') === 0)).to.deep.equal(
                    filtered
                        ? ['Checkout intent is off: the event name filter keeps some or all Auto Button Click events from the Rokt kit.']
                        : []
                );
            }));

            it('turns back on when a re-init drops the filter', async () => {
                const eventNameFilters = [
                    KitFilterHelper.hashEventName('Auto Button Click', EventType.Other),
                ];
                const filtered = await initWith({ kitConfigs: [{ ...roktConfig, eventNameFilters }] });
                expect(filtered.isCheckoutIntentLive()).to.equal(false);

                const roktManager = await initWith({ kitConfigs: [roktConfig] });

                expect(roktManager.isCheckoutIntentLive()).to.equal(true);
            });

            describe('when the Rokt kit first reads it', () => {
                const eventNameFilters = [
                    KitFilterHelper.hashEventName('Auto Button Click', EventType.Other),
                ];
                let seen: string[];

                beforeEach(() => {
                    seen = [];
                    const live = () => window.mParticle.getInstance()._RoktManager.isCheckoutIntentLive();
                    const RoktKitProbe = function(this: any) {
                        this.name = 'Rokt';
                        this.id = 181;
                        this.init = () => {
                            seen.push(`init ${live()}`);
                            return 'ok';
                        };
                        this.process = (event: { EventDataType: number }) => {
                            if (event.EventDataType === MessageType.PageView) {
                                seen.push(`page view ${live()}`);
                            }
                        };
                    };
                    window.mParticle.config.kits = { Rokt: { constructor: RoktKitProbe } } as any;
                });

                afterEach(() => {
                    delete window.mParticle.config.kits;
                });

                const initWithRoktKit = (overrides: Partial<IKitConfigs> = {}) =>
                    initWith({
                        kitConfigs: [{ ...Utils.forwarderDefaultConfiguration('Rokt', 181), ...overrides }],
                        flags: { autoButtonTracking: 'True', autoLogPageView: 'True' },
                    } as Partial<SDKInitConfig>);

                it('is already live for a new shopper', async () => {
                    await initWithRoktKit();

                    expect(seen).to.deep.equal(['init true', 'page view true']);
                });

                // A saved MPID lets the landing page view reach the kit during init
                // rather than after the identify call.
                it('is already live for a returning shopper', async () => {
                    Utils.setLocalStorage();

                    await initWithRoktKit();

                    expect(seen).to.deep.equal(['init true', 'page view true']);
                });

                it('already reflects the new connection after a re-init', async () => {
                    await initWithRoktKit();
                    seen = [];

                    await initWithRoktKit({ eventNameFilters });

                    expect(seen).to.deep.equal(['init false']);
                });
            });
        });

        it('stops listening on reset', async () => {
            const started = initAndExpectTracker({
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);
            expectTrackerKeptThroughWait(started);
            const earlier = activeTracker();

            window.mParticle.reset();

            expect(earlier.isActive).to.equal(false);
            expect(activeTracker()).to.equal(undefined);
        });

        // An earlier bundle load leaves a tracker the new instance has no reference to.
        it('stops a tracker from an earlier bundle load when re-init turns the flag off', async () => {
            const started = initAndExpectTracker({
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'True' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);
            expectTrackerKeptThroughWait(started);
            const earlier = activeTracker();
            window.mParticle.getInstance()._ButtonTracker = undefined;

            window.mParticle.init(apiKey, {
                ...window.mParticle.config,
                flags: { autoButtonTracking: 'False' },
                kitConfigs: [roktConfig],
            });
            await waitForCondition(hasIdentifyReturned);

            expect(earlier.isActive).to.equal(false);
            expect(activeTracker()).to.equal(undefined);
        });
    });
});

/* eslint-env es6, mocha */
/* eslint-parser babel-eslint */

const packageVersion = require('../../package.json').version;
const sdkVersion = 'mParticle_wsdkv_1.2.3';
const kitVersion = 'kitv_' + packageVersion;

const waitForCondition = async (conditionFn, timeout = 200, interval = 10) => {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        (function poll() {
            if (conditionFn()) {
                return resolve(undefined);
            } else if (Date.now() - startTime > timeout) {
                return reject(new Error('Timeout waiting for condition'));
            } else {
                setTimeout(poll, interval);
            }
        })();
    });
};

describe('Rokt Forwarder', () => {
    var EventType = {
        Unknown: 0,
        Navigation: 1,
        Location: 2,
        Search: 3,
        Transaction: 4,
        UserContent: 5,
        UserPreference: 6,
        Social: 7,
        Other: 8,
        Media: 9,
    };
    var MessageType = {
        SessionStart: 1,
        SessionEnd: 2,
        PageView: 3,
        PageEvent: 4,
        CrashReport: 5,
        OptOut: 6,
        Commerce: 16,
    };
    var ReportingService = function () {
        var self = this;

        this.id = null;
        this.event = null;

        this.cb = function (forwarder, event) {
            self.id = forwarder.id;
            self.event = event;
        };

        this.reset = function () {
            this.id = null;
            this.event = null;
        };
    };
    var reportService = new ReportingService();

    // -------------------DO NOT EDIT ANYTHING ABOVE THIS LINE-----------------------
    // -------------------START EDITING BELOW:-----------------------
    // -------------------mParticle stubs - Add any additional stubbing to our methods as needed-----------------------
    mParticle.getEnvironment = function () {
        return 'development';
    };
    mParticle.getVersion = function () {
        return '1.2.3';
    };
    mParticle.Identity = {
        getCurrentUser: function () {
            return {
                getMPID: function () {
                    return '123';
                },
            };
        },
    };
    mParticle._Store = {
        localSessionAttributes: {},
    };
    mParticle._getActiveForwarders = function () {
        return [];
    };
    mParticle.generateHash = function (input) {
        return 'hashed-<' + input + '>-value';
    };
    // Mock for logEvent to capture custom event logging
    mParticle.loggedEvents = [];
    mParticle.logEvent = function (eventName, eventType, eventAttributes) {
        mParticle.loggedEvents.push({
            eventName: eventName,
            eventType: eventType,
            eventAttributes: eventAttributes,
        });
    };
    // -------------------START EDITING BELOW:-----------------------
    var MockRoktForwarder = function () {
        var self = this;

        this.initializeCalled = false;
        this.isInitialized = false;
        this.accountId = null;
        this.sandbox = null;
        this.integrationName = null;
        this.createLauncherCalled = false;
        this.createLocalLauncherCalled = false;

        this.createLauncher = function (options) {
            self.accountId = options.accountId;
            self.integrationName = options.integrationName;
            self.noFunctional = options.noFunctional;
            self.noTargeting = options.noTargeting;
            self.createLauncherCalled = true;
            self.isInitialized = true;
            self.sandbox = options.sandbox;

            return Promise.resolve({
                then: function (callback) {
                    callback();
                },
            });
        };

        this.createLocalLauncher = function (options) {
            self.accountId = options.accountId;
            self.integrationName = options.integrationName;
            self.noFunctional = options.noFunctional;
            self.noTargeting = options.noTargeting;
            self.createLocalLauncherCalled = true;
            self.isInitialized = true;
            self.sandbox = options.sandbox;

            return {
                selectPlacements: function () {},
                hashAttributes: function () {
                    throw new Error('hashAttributes not implemented');
                },
                use: function () {
                    throw new Error('use not implemented');
                },
            };
        };

        this.currentLauncher = function () {};
    };

    before(() => {});

    beforeEach(() => {
        window.Rokt = new MockRoktForwarder();
        window.mParticle.Rokt = window.Rokt;
    });

    afterEach(() => {
        window.mParticle.forwarder.userAttributes = {};
        delete window.mParticle.forwarder.launcherOptions;
        delete window.mParticle.Rokt.launcherOptions;
    });

    describe('#initForwarder', () => {
        beforeEach(() => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                Promise.resolve();
            };
            window.mParticle.Rokt.filters = {
                userAttributesFilters: [],
                filterUserAttributes: function (attributes) {
                    return attributes;
                },
                filteredUser: {
                    getMPID: function () {
                        return '123';
                    },
                },
            };
        });

        it('should initialize the Rokt Web SDK', async () => {
            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {}
            );

            window.Rokt.accountId.should.equal('123456');
            window.Rokt.createLauncherCalled.should.equal(true);
        });

        it('should set sandbox to true if sandbox is true in launcherOptions', async () => {
            window.mParticle.Rokt.launcherOptions = {
                sandbox: true,
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );

            window.Rokt.createLauncherCalled.should.equal(true);
            window.Rokt.sandbox.should.equal(true);
        });

        it('should set sandbox to false if sandbox is false in launcherOptions', async () => {
            window.mParticle.Rokt.launcherOptions = {
                sandbox: false,
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );

            window.Rokt.createLauncherCalled.should.equal(true);
            window.Rokt.sandbox.should.equal(false);
        });

        it('should set optional settings from launcherOptions', async () => {
            window.mParticle.Rokt.launcherOptions = {
                integrationName: 'customName',
                noFunctional: true,
                noTargeting: true,
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {},
                null,
                null,
                null
            );

            const expectedIntegrationName = `${sdkVersion}_${kitVersion}_customName`;

            window.Rokt.createLauncherCalled.should.equal(true);
            window.Rokt.accountId.should.equal('123456');
            window.Rokt.integrationName.should.equal(expectedIntegrationName);
            window.Rokt.noFunctional.should.equal(true);
            window.Rokt.noTargeting.should.equal(true);
        });

        it('should set the filters on the forwarder', async () => {
            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {}
            );

            // Wait for initialization to complete (after launcher is created)
            await waitForCondition(() => {
                return window.mParticle.forwarder.isInitialized;
            });

            window.mParticle.Rokt.kit.filters.should.deepEqual({
                userAttributesFilters: [],
                filterUserAttributes: function (attributes) {
                    return attributes;
                },
                filteredUser: {
                    getMPID: function () {
                        return '123';
                    },
                },
            });

            window.mParticle.Rokt.kit.filters.filteredUser
                .getMPID()
                .should.equal('123');
        });

        it('should set integrationName in the correct format', async () => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async () => {
                window.mParticle.Rokt.attachKitCalled = true;
                return Promise.resolve();
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );

            window.Rokt.integrationName.should.equal(
                `${sdkVersion}_${kitVersion}`
            );
        });

        it('should set integrationName on kit instance after attaching', async () => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;

            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                return Promise.resolve();
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );

            // Wait for initialization to complete
            await waitForCondition(() => window.mParticle.Rokt.isInitialized);

            window.mParticle.Rokt.kit.integrationName.should.equal(
                `${sdkVersion}_${kitVersion}`
            );
        });

        it('should set integrationName on kit instance with custom name when provided', async () => {
            const customName = 'myCustomName';

            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;

            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                return Promise.resolve();
            };

            window.mParticle.Rokt.launcherOptions = {
                integrationName: customName,
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );

            // Wait for initialization to complete
            await waitForCondition(() => window.mParticle.Rokt.isInitialized);

            window.mParticle.Rokt.kit.integrationName.should.equal(
                `${sdkVersion}_${kitVersion}_${customName}`
            );
        });

        it('should have integrationName available on kit after initialization', async () => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;

            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                return Promise.resolve();
            };

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );

            // Wait for initialization to complete
            await waitForCondition(() => window.mParticle.Rokt.isInitialized);

            window.mParticle.Rokt.attachKitCalled.should.equal(true);
            window.mParticle.Rokt.kit.integrationName.should.be.a.String();
            window.mParticle.Rokt.kit.integrationName.should.not.be.empty();
        });

        it('should not mutate the global launcherOptions object during initialization', async () => {
            const originalIntegrationName = 'globalIntegrationName';

            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async () => {
                window.mParticle.Rokt.attachKitCalled = true;
                return Promise.resolve();
            };

            // Set up the global launcherOptions with a custom integration name
            window.mParticle.Rokt.launcherOptions = {
                integrationName: originalIntegrationName,
                sandbox: true,
            };

            // Store reference to verify it doesn't get mutated
            const originalLauncherOptions =
                window.mParticle.Rokt.launcherOptions;

            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {},
                null,
                null,
                null
            );

            originalLauncherOptions.integrationName.should.equal(
                'globalIntegrationName'
            );
            originalLauncherOptions.sandbox.should.equal(true);

            // Verify the kit still gets the processed integration name
            const expectedProcessedName = `${sdkVersion}_${kitVersion}_${originalIntegrationName}`;
            window.Rokt.integrationName.should.equal(expectedProcessedName);
        });

        it('should initialize the kit with placement event mapping lookup from a config', async () => {
            await mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventMapping: JSON.stringify([
                        {
                            jsmap: '-1484452948',
                            map: '-5208850776883573773',
                            maptype: 'EventClass.Id',
                            value: 'foo-mapped-flag',
                        },
                        {
                            jsmap: '1838502119',
                            map: '1324617889422969328',
                            maptype: 'EventClass.Id',
                            value: 'ad_viewed_test',
                        },
                    ]),
                },
                reportService.cb,
                true,
                null,
                {}
            );

            // Wait for initialization to complete (after launcher is created)
            await waitForCondition(() => window.mParticle.Rokt.isInitialized);

            window.mParticle.forwarder.placementEventMappingLookup.should.deepEqual(
                {
                    '-1484452948': 'foo-mapped-flag',
                    1838502119: 'ad_viewed_test',
                }
            );
        });
    });

    describe('#hashAttributes', () => {
        beforeEach(() => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                Promise.resolve();
            };
            window.mParticle.forwarder.launcher = {
                hashAttributes: function (attributes) {
                    // Mocking the hashAttributes method to show that
                    // the attributes will be transformed by the launcher's
                    // hashAttributes method.
                    const hashedAttributes = {};
                    for (const key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            hashedAttributes[key + '-hash'] =
                                'hashed-' + attributes[key];
                        }
                    }
                    window.mParticle.Rokt.hashedAttributes = hashedAttributes;
                    window.mParticle.Rokt.hashAttributesCalled = true;

                    return Promise.resolve(hashedAttributes);
                },
            };
        });

        it('should call launcher.hashAttributes with passed through attributes when fully initialized', function () {
            // Ensure both initialization conditions are met
            window.mParticle.forwarder.isInitialized = true;
            window.mParticle.forwarder.launcher = {
                hashAttributes: function (attributes) {
                    window.mParticle.Rokt.hashAttributesOptions = attributes;
                    window.mParticle.Rokt.hashAttributesCalled = true;
                    return {
                        'test-attribute': 'hashed-value',
                    };
                },
            };

            var attributes = {
                'test-attribute': 'test-value',
            };

            window.mParticle.forwarder.hashAttributes(attributes);

            window.Rokt.hashAttributesCalled.should.equal(true);
            window.Rokt.hashAttributesOptions.should.deepEqual(attributes);
        });

        it('should return null when launcher exists but kit is not initialized', function () {
            // Set launcher but ensure isInitialized is false
            window.mParticle.forwarder.isInitialized = false;
            window.mParticle.forwarder.launcher = {
                hashAttributes: function () {},
            };

            var result = window.mParticle.forwarder.hashAttributes({
                'test-attribute': 'test-value',
            });

            (result === null).should.equal(true);
        });

        it('should log an error when called before initialization', function () {
            var errorLogged = false;
            var errorMessage = null;
            window.console.error = function (message) {
                errorLogged = true;
                errorMessage = message;
            };

            // Ensure kit is not initialized
            window.mParticle.forwarder.isInitialized = false;
            window.mParticle.forwarder.launcher = null;

            window.mParticle.forwarder.hashAttributes({
                'test-attribute': 'test-value',
            });

            errorLogged.should.equal(true);
            errorMessage.should.equal('Rokt Kit: Not initialized');
        });

        it('should return null when kit is initialized but launcher is missing', function () {
            // Mock isInitialized but remove launcher
            window.mParticle.forwarder.isInitialized = true;
            window.mParticle.forwarder.launcher = null;

            var result = window.mParticle.forwarder.hashAttributes({
                'test-attribute': 'test-value',
            });

            (result === null).should.equal(true);
        });

        it('should log an error when kit is initialized but launcher is missing', function () {
            var errorLogged = false;
            var errorMessage = null;
            window.console.error = function (message) {
                errorLogged = true;
                errorMessage = message;
            };

            window.mParticle.forwarder.isInitialized = true;
            window.mParticle.forwarder.launcher = null;

            window.mParticle.forwarder.hashAttributes({
                'test-attribute': 'test-value',
            });

            errorLogged.should.equal(true);
            errorMessage.should.equal('Rokt Kit: Not initialized');
        });

        it('should return hashed attributes from launcher', async () => {
            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {}
            );

            const result = await window.mParticle.forwarder.hashAttributes({
                'test-attribute': 'test-value',
            });

            result.should.deepEqual({
                'test-attribute-hash': 'hashed-test-value',
            });
        });
    });

    describe('#attachLauncher', () => {
        let mockMessageQueue;

        beforeEach(() => {
            mockMessageQueue = [];

            // Reset forwarder state between tests
            window.mParticle.forwarder.isInitialized = false;

            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;

            // Ensure currentLauncher is undefined to trigger script appending
            window.Rokt.currentLauncher = undefined;

            // Set attachKit as async to allow for await calls in the test
            // This is necessary to simiulate a race condition between the
            // core sdk and the Rokt forwarder
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;

                // Call queued messages
                mockMessageQueue.forEach((message) => message());
                mockMessageQueue = [];

                return Promise.resolve();
            };
            window.mParticle.Rokt.filters = {
                userAttributesFilters: [],
                filterUserAttributes: function (attributes) {
                    return attributes;
                },
                filteredUser: {
                    getMPID: function () {
                        return '123';
                    },
                },
            };
            window.mParticle.config = undefined;
            Math.random = () => 1;

            window.mParticle.captureTiming = function (metricName) {
                window.mParticle.Rokt.capturedPerformanceMetric = metricName;
            };
        });

        it('should add a performance marker when the script is appended', async () => {
            var savedRokt = window.mParticle.Rokt;
            window.Rokt = undefined;
            window.mParticle.Rokt = {
                domain: 'apps.rokt.com',
                attachKit: async () => Promise.resolve(),
                filters: savedRokt.filters,
            };

            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                false,
                null,
                {}
            );

            window.mParticle.Rokt.capturedPerformanceMetric.should.equal(
                'mp:RoktScriptAppended'
            );
        });

        it('should create a remote launcher if the partner is not in the local launcher test group', async () => {
            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.Rokt.createLauncherCalled.should.equal(true);
            window.mParticle.Rokt.createLocalLauncherCalled.should.equal(false);
        });

        it('should create a local launcher if the partner is in the local launcher test group', async () => {
            window.mParticle.config = {
                isLocalLauncherEnabled: true,
            };

            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.Rokt.createLauncherCalled.should.equal(false);
            window.mParticle.Rokt.createLocalLauncherCalled.should.equal(true);
        });

        it('should create a remote launcher if the partner is in the local launcher test group but the random number is below the thresholds', async () => {
            window.mParticle.config = {
                isLocalLauncherEnabled: true,
            };

            Math.random = () => 0;

            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.Rokt.createLauncherCalled.should.equal(true);
            window.mParticle.Rokt.createLocalLauncherCalled.should.equal(false);
        });

        it('should create a local launcher if the partner is in the local launcher test group but the random number is above the thresholds', async () => {
            window.mParticle.config = {
                isLocalLauncherEnabled: true,
            };

            Math.random = () => 1;

            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.Rokt.createLauncherCalled.should.equal(false);
            window.mParticle.Rokt.createLocalLauncherCalled.should.equal(true);
        });

        it('should call attachKit', async () => {
            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle.Rokt.attachKitCalled.should.equal(true);
        });

        it('should set isInitialized to true', async () => {
            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle.forwarder.isInitialized.should.equal(true);
        });

        // This test is to ensure the kit is initialized before attaching to the Rokt manager
        // so we can ensure that the Rokt Manager's message queue is processed and that
        // all the isReady() checks are properly handled in by the Rokt Manager.
        // This is to validate in case a bug that was found in the Rokt Manager's
        // queueing logic regresses.
        it('should initialize the kit before calling queued messages', async () => {
            let queuedMessageCalled = false;
            let wasKitInitializedFirst = false;

            const queuedMessage = () => {
                wasKitInitializedFirst =
                    window.mParticle.Rokt.kit &&
                    window.mParticle.Rokt.kit.isInitialized;
                queuedMessageCalled = true;
            };

            mockMessageQueue.push(queuedMessage);

            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.forwarder.isInitialized.should.equal(false);
            queuedMessageCalled.should.equal(false);

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle.forwarder.isInitialized.should.equal(true);
            queuedMessageCalled.should.equal(true);

            wasKitInitializedFirst.should.equal(true);

            mockMessageQueue.length.should.equal(0);
        });

        it('should call createLauncher when launcher is embedded and not yet initialized', async () => {
            await window.mParticle.forwarder.init(
                { accountId: '123456' },
                reportService.cb,
                false,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle.Rokt.createLauncherCalled.should.equal(true);
        });
    });

    describe('#selectPlacements', () => {
        beforeEach(() => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKit = async () => {
                window.mParticle.Rokt.attachKitCalled = true;
                return Promise.resolve();
            };
            mParticle.loggedEvents = [];
            window.mParticle.Rokt.setLocalSessionAttribute = function (
                key,
                value
            ) {
                mParticle._Store.localSessionAttributes[key] = value;
            };
            window.mParticle.Rokt.getLocalSessionAttributes = function () {
                return mParticle._Store.localSessionAttributes;
            };
            window.mParticle.Rokt.store = window.mParticle._Store;
            window.mParticle.Rokt.store.localSessionAttributes = {};
            window.mParticle.forwarder.launcher = {
                selectPlacements: function (options) {
                    window.mParticle.Rokt.selectPlacementsOptions = options;
                    window.mParticle.Rokt.selectPlacementsCalled = true;
                },
            };
            window.mParticle.forwarder.filters = {
                userAttributesFilters: [],
                filterUserAttributes: function (attributes) {
                    return attributes;
                },
                filteredUser: {
                    getMPID: function () {
                        return '123';
                    },
                },
            };
        });

        describe('Default initialization', () => {
            it('should call launcher.selectPlacements with all passed through options', async () => {
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        test: 'test',
                    },
                });

                window.Rokt.selectPlacementsCalled.should.equal(true);
                window.Rokt.selectPlacementsOptions.should.deepEqual({
                    identifier: 'test-placement',
                    attributes: {
                        test: 'test',
                        mpid: '123',
                    },
                });
            });

            it('should collect mpid and send to launcher.selectPlacements', async () => {
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'user-attribute': 'user-attribute-value',
                    }
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'user-attribute': 'user-attribute-value',
                    },
                });

                window.Rokt.selectPlacementsCalled.should.equal(true);
                window.Rokt.selectPlacementsOptions.should.deepEqual({
                    identifier: 'test-placement',
                    attributes: {
                        'user-attribute': 'user-attribute-value',
                        mpid: '123',
                    },
                });
            });

            it('should collect local session attributes and send to launcher.selectPlacements', async () => {
                window.mParticle.Rokt.store.localSessionAttributes = {
                    'custom-local-attribute': true,
                    'secondary-local-attribute': true,
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        placementEventMapping: JSON.stringify([
                            {
                                jsmap: 'test-event-hash',
                                map: 'test-event-map',
                                maptype: 'EventClass.Id',
                                value: 'test-mapped-flag',
                            },
                        ]),
                    },
                    reportService.cb,
                    true
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'test-attribute': 'test-value',
                    },
                });

                window.Rokt.selectPlacementsCalled.should.equal(true);
                window.Rokt.selectPlacementsOptions.should.deepEqual({
                    identifier: 'test-placement',
                    attributes: {
                        mpid: '123',
                        'test-attribute': 'test-value',
                        'custom-local-attribute': true,
                        'secondary-local-attribute': true,
                    },
                });
            });

            it('should not throw an error if getLocalSessionAttributes is not available', async () => {
                let errorLogged = false;
                const originalConsoleError = console.error;
                console.error = function (message) {
                    if (
                        message &&
                        message.indexOf &&
                        message.indexOf(
                            'Error getting local session attributes'
                        ) !== -1
                    ) {
                        errorLogged = true;
                    }
                    originalConsoleError.apply(console, arguments);
                };

                delete window.mParticle.Rokt.getLocalSessionAttributes;

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'test-attribute': 'test-value',
                    },
                });

                errorLogged.should.equal(false);

                console.error = originalConsoleError;
            });
        });

        describe('User Attributes', () => {
            it('should call launcher.selectPlacements with filtered user attributes', async () => {
                window.mParticle.forwarder.filters.filterUserAttributes =
                    function () {
                        return {
                            'user-attribute': 'user-attribute-value',
                            'unfiltered-attribute': 'unfiltered-value',
                        };
                    };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'unfiltered-attribute': 'unfiltered-value',
                        'filtered-attribute': 'filtered-value',
                    },
                });

                window.Rokt.selectPlacementsCalled.should.equal(true);
                window.Rokt.selectPlacementsOptions.should.deepEqual({
                    identifier: 'test-placement',
                    attributes: {
                        'user-attribute': 'user-attribute-value',
                        'unfiltered-attribute': 'unfiltered-value',
                        mpid: '123',
                    },
                });
            });

            it('should filter user attributes through filterUserAttributes function before sending to selectPlacements', async () => {
                // Mocked filterUserAttributes function will return filtered attributes
                // based on the config passed in the init method and will ultimately
                // remove any attributes from the init method that are filtered.
                // Also, any initial attributes from the init call that have updated
                // durring runtime should be returned by the filterUserAttribute method.
                window.mParticle.forwarder.filters.filterUserAttributes =
                    function () {
                        return {
                            'user-attribute': 'user-attribute-value',
                            'unfiltered-attribute': 'unfiltered-value',
                            'changed-attribute': 'new-value',
                        };
                    };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        // These should be filtered out
                        'blocked-attribute': 'blocked-value',
                        'initial-user-attribute':
                            'initial-user-attribute-value',

                        // This should be updated
                        'changed-attribute': 'old-value',
                    }
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        // This should pass through
                        'unfiltered-attribute': 'unfiltered-value',

                        // This should be filtered out
                        'filtered-attribute': 'filtered-value',
                    },
                });

                window.Rokt.selectPlacementsCalled.should.equal(true);
                window.Rokt.selectPlacementsOptions.should.deepEqual({
                    identifier: 'test-placement',
                    attributes: {
                        'user-attribute': 'user-attribute-value',
                        'unfiltered-attribute': 'unfiltered-value',
                        'changed-attribute': 'new-value',
                        mpid: '123',
                    },
                });
            });
        });

        describe('Identity handling', () => {
            beforeEach(() => {
                window.Rokt = new MockRoktForwarder();
                window.mParticle.Rokt = window.Rokt;
                window.mParticle.Rokt.attachKitCalled = false;
                window.mParticle.Rokt.attachKit = async (kit) => {
                    window.mParticle.Rokt.attachKitCalled = true;
                    window.mParticle.Rokt.kit = kit;
                    Promise.resolve();
                };
                window.mParticle.Rokt.setLocalSessionAttribute = function (
                    key,
                    value
                ) {
                    mParticle._Store.localSessionAttributes[key] = value;
                };
                window.mParticle.Rokt.getLocalSessionAttributes = function () {
                    return mParticle._Store.localSessionAttributes;
                };
                window.mParticle.forwarder.launcher = {
                    selectPlacements: function (options) {
                        window.mParticle.Rokt.selectPlacementsOptions = options;
                        window.mParticle.Rokt.selectPlacementsCalled = true;
                    },
                };
            });

            it('should send userAttributes if userIdentities is null but userAttributes exists', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return 'abc';
                        },
                        getUserIdentities: function () {
                            return { userIdentities: {} };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'test-attribute': 'test-value',
                    }
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        mpid: 'abc',
                    }
                );
            });

            it('should send userIdentities when userAttributes is null but userIdentities exists', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '234';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer123',
                                    email: 'test@example.com',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        customerid: 'customer123',
                        email: 'test@example.com',
                        mpid: '234',
                    }
                );
            });

            it('should send userAttributes and userIdentities if both exist', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '123';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer123',
                                    email: 'test@example.com',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'test-attribute': 'test-value',
                    }
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        customerid: 'customer123',
                        email: 'test@example.com',
                        mpid: '123',
                    }
                );
            });

            it('should not send userIdentities if filteredUser is null', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: null,
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'test-attribute': 'test-value',
                    }
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        mpid: null,
                    }
                );
            });

            it('should not send userIdentities if getUserIdentities function does not exist', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '123';
                        },
                        // getUserIdentities is intentionally missing
                    },
                };

                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'test-attribute': 'test-value',
                    }
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        mpid: '123',
                    }
                );
            });

            it('should map other userIdentities to emailsha256', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '234';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer123',
                                    other: 'sha256-test@gmail.com',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        customerid: 'customer123',
                        emailsha256: 'sha256-test@gmail.com',
                        mpid: '234',
                    }
                );
            });

            it('should map other to emailsha256 when other is passed through selectPlacements', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '123';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer123',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'test-attribute': 'test-value',
                    }
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        other: 'other-attribute',
                    },
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        customerid: 'customer123',
                        other: 'other-attribute',
                        mpid: '123',
                    }
                );
            });

            it('should pass the attribute `other` in selectPlacements directly to Rokt', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '123';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer123',
                                    other: 'other-id',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'test-attribute': 'test-value',
                    }
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        other: 'continues-to-exist',
                    },
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        customerid: 'customer123',
                        other: 'continues-to-exist',
                        emailsha256: 'other-id',
                        mpid: '123',
                    }
                );
            });

            it('should use custom hashedEmailUserIdentityType when provided in settings', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '789';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    // Using 'customerid' as the identity type instead of 'other'
                                    other5: 'hashed-customer-id-value',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other5', // TitleCase from server
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'test-attribute': 'test-value',
                    },
                });

                // Should map customerid from userIdentities to emailsha256 since hashedEmailUserIdentityType was set to 'CustomerID'
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attribute': 'test-value',
                        emailsha256: 'hashed-customer-id-value', // mapped from customerid in userIdentities
                        mpid: '789',
                    }
                );
            });

            it('should NOT set emailsha256 on final select placements attributes when hashedEmailUserIdentityType is Unassigned', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '999';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    // Using lowercase identity name that matches the converted OTHER_IDENTITY
                                    other: 'hashed-custom-identity-value',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Unassigned', // Mixed case from server
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'test-attr': 'test-value',
                    },
                });

                // Should map customidentity from userIdentities to emailsha256 (TitleCase converted to lowercase)
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        'test-attr': 'test-value',
                        other: 'hashed-custom-identity-value',
                        mpid: '999',
                    }
                );
            });

            it('should keep both email and emailsha256 when emailsha256 is passed through selectPlacements and email exists in userIdentities', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '456';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'test@example.com',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        emailsha256: 'hashed-email-value',
                    },
                });

                // Should keep both email from userIdentities and emailsha256 from selectPlacements
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'test@example.com',
                        emailsha256: 'hashed-email-value',
                        mpid: '456',
                    }
                );
            });

            it('should keep both email and emailsha256 when both are passed through selectPlacements', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '789';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'identity-email@example.com',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        email: 'developer-email@example.com',
                        emailsha256: 'hashed-email-value',
                    },
                });

                // Should keep both email and emailsha256 since developer explicitly passed both
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'developer-email@example.com',
                        emailsha256: 'hashed-email-value',
                        mpid: '789',
                    }
                );
            });

            it('should include email in kit.selectPlacements call if not passed, and email exists in userIdentities', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '901';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'identity-email@example.com',
                                    customerid: 'customer456',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        someAttribute: 'someValue',
                    },
                });

                // Should keep email from userIdentities since emailsha256 does not exist
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'identity-email@example.com',
                        customerid: 'customer456',
                        someAttribute: 'someValue',
                        mpid: '901',
                    }
                );
            });

            it('should have both email and emailsha256 in kit.selectPlacements call if both exist on userIdentities, and neither is passed through selectPlacements', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '912';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'identity-email@example.com',
                                    other: 'hashed-from-other',
                                    customerid: 'customer789',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                // Should keep both email and emailsha256 since emailsha256 was mapped from other identity (not explicitly passed)
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'identity-email@example.com',
                        emailsha256: 'hashed-from-other',
                        customerid: 'customer789',
                        mpid: '912',
                    }
                );
            });

            it('should keep only email from selectPlacements when no emailsha256 exists', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '934';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer202',
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        email: 'developer-email@example.com',
                    },
                });

                // Should keep email from selectPlacements since no emailsha256 exists
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'developer-email@example.com',
                        customerid: 'customer202',
                        mpid: '934',
                    }
                );
            });

            it('should keep only emailsha256 from selectPlacements when no email exists in userIdentities', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '945';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer303',
                                },
                            };
                        },
                    },
                };

                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        emailsha256: 'developer-hashed-email',
                    },
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        emailsha256: 'developer-hashed-email',
                        customerid: 'customer303',
                        mpid: '945',
                    }
                );
            });

            it('should have nothing when neither email nor emailsha256 exist anywhere', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '967';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    customerid: 'customer505',
                                },
                            };
                        },
                    },
                };

                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        customerid: 'customer505',
                        mpid: '967',
                    }
                );
            });

            it('should keep only emailsha256 from userIdentities when email is not in userIdentities and developer passes nothing', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '978';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    other: 'hashed-from-useridentities',
                                    customerid: 'customer606',
                                },
                            };
                        },
                    },
                };

                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        emailsha256: 'hashed-from-useridentities',
                        customerid: 'customer606',
                        mpid: '978',
                    }
                );
            });

            it('should keep both when developer passes both and both exist in userIdentities', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function (attributes) {
                        return attributes;
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '992';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'useridentity-email@example.com',
                                    other: 'hashed-from-useridentities',
                                    customerid: 'customer909',
                                },
                            };
                        },
                    },
                };

                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        email: 'developer-email@example.com',
                        emailsha256: 'developer-hashed-email',
                    },
                });

                // Should use developer-passed values for both
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'developer-email@example.com',
                        emailsha256: 'developer-hashed-email',
                        customerid: 'customer909',
                        mpid: '992',
                    }
                );
            });

            it('should NOT map other userIdentities to emailsha256 when the value is an empty string', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '234';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'test@gmail.com',
                                    other: '', // Empty string
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                // Should NOT include emailsha256 since the other identity value was empty
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'test@gmail.com',
                        mpid: '234',
                    }
                );
            });

            it('should NOT map other userIdentities to emailsha256 when the value is null', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '345';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'test@gmail.com',
                                    other: null, // Null value
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                // Should NOT include emailsha256 since the other identity value was null
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'test@gmail.com',
                        mpid: '345',
                    }
                );
            });

            it('should NOT map other userIdentities to emailsha256 when the value is undefined', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '456';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'test@gmail.com',
                                    other: undefined, // Undefined value
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                // Should NOT include emailsha256 since the other identity value was undefined
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'test@gmail.com',
                        mpid: '456',
                    }
                );
            });

            it('should NOT map other userIdentities to emailsha256 when the value is 0', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '567';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'test@gmail.com',
                                    other: 0, // Zero value
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                // Should NOT include emailsha256 since the other identity value was 0
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'test@gmail.com',
                        mpid: '567',
                    }
                );
            });

            it('should NOT map other userIdentities to emailsha256 when the value is false', async () => {
                window.mParticle.Rokt.filters = {
                    userAttributeFilters: [],
                    filterUserAttributes: function () {
                        return {};
                    },
                    filteredUser: {
                        getMPID: function () {
                            return '678';
                        },
                        getUserIdentities: function () {
                            return {
                                userIdentities: {
                                    email: 'test@gmail.com',
                                    other: false, // False value
                                },
                            };
                        },
                    },
                };

                // Set up the createLauncher to properly resolve asynchronously
                window.Rokt.createLauncher = async function () {
                    return Promise.resolve({
                        selectPlacements: function (options) {
                            window.mParticle.Rokt.selectPlacementsOptions =
                                options;
                            window.mParticle.Rokt.selectPlacementsCalled = true;
                        },
                    });
                };
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                        hashedEmailUserIdentityType: 'Other',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );
                // Wait for initialization to complete (after launcher is created)
                await waitForCondition(() => {
                    return window.mParticle.forwarder.isInitialized;
                });

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {},
                });

                // Should NOT include emailsha256 since the other identity value was false
                window.Rokt.selectPlacementsOptions.attributes.should.deepEqual(
                    {
                        email: 'test@gmail.com',
                        mpid: '678',
                    }
                );
            });
        });

        describe('#logSelectPlacementsEvent', () => {
            it('should log a custom event', async () => {
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'cached-user-attr': 'cached-value',
                    }
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'new-attr': 'new-value',
                    },
                });

                mParticle.loggedEvents.length.should.equal(1);
                mParticle.loggedEvents[0].eventName.should.equal(
                    'selectPlacements'
                );
                mParticle.loggedEvents[0].eventType.should.equal(8); // EventType.Other

                const eventAttributes =
                    mParticle.loggedEvents[0].eventAttributes;
                eventAttributes.should.have.property('mpid');
            });

            it('should include merged user attributes, identities, and mpid', async () => {
                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {
                        'cached-user-attr': 'cached-value',
                    }
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        'new-attr': 'new-value',
                    },
                });

                const eventAttributes =
                    mParticle.loggedEvents[0].eventAttributes;

                // eventAttributes should include merged attributes and mpid directly
                eventAttributes.should.have.property('mpid', '123');
                eventAttributes.should.have.property('new-attr', 'new-value');
                eventAttributes.should.have.property(
                    'cached-user-attr',
                    'cached-value'
                );
            });

            it('should skip logging when mParticle.logEvent is not available', async () => {
                var originalLogEvent = window.mParticle.logEvent;
                window.mParticle.logEvent = undefined;

                await window.mParticle.forwarder.init(
                    {
                        accountId: '123456',
                    },
                    reportService.cb,
                    true,
                    null,
                    {}
                );

                await window.mParticle.forwarder.selectPlacements({
                    identifier: 'test-placement',
                    attributes: {
                        attr: 'value',
                    },
                });

                window.Rokt.selectPlacementsCalled.should.equal(true);
                mParticle.loggedEvents.length.should.equal(0);
                window.mParticle.logEvent = originalLogEvent;
            });
        });
    });

    describe('#use', () => {
        beforeEach(() => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                Promise.resolve();
            };
        });

        it('should call launcher.use with the provided extension name when fully initialized', async () => {
            window.mParticle.forwarder.isInitialized = true;
            window.mParticle.forwarder.launcher = {
                use: function (name) {
                    window.Rokt.useCalled = true;
                    window.Rokt.useName = name;
                    return Promise.resolve({});
                },
            };

            await window.mParticle.forwarder.use('ThankYouPageJourney');

            window.Rokt.useCalled.should.equal(true);
            window.Rokt.useName.should.equal('ThankYouPageJourney');
        });

        it('should reject when called before initialization', async () => {
            window.mParticle.forwarder.isInitialized = false;

            try {
                await window.mParticle.forwarder.use('ThankYouPageJourney');
            } catch (error) {
                error.message.should.equal('Rokt Kit: Not initialized');
            }
        });

        it('should log an error when called before initialization', async () => {
            const originalConsoleError = window.console.error;
            let errorLogged = false;
            let errorMessage = null;
            window.console.error = function (message) {
                errorLogged = true;
                errorMessage = message;
            };

            window.mParticle.forwarder.isInitialized = false;
            window.mParticle.forwarder.launcher = null;

            try {
                await window.mParticle.forwarder.use('ThankYouPageJourney');
                throw new Error('Expected promise to reject');
            } catch (error) {
                error.message.should.equal('Rokt Kit: Not initialized');
            } finally {
                window.console.error = originalConsoleError;
            }

            errorLogged.should.equal(true);
            errorMessage.should.equal('Rokt Kit: Not initialized');
        });

        it('should reject when extension name is invalid', async () => {
            window.mParticle.forwarder.isInitialized = true;
            window.mParticle.forwarder.launcher = {
                use: function () {
                    return Promise.resolve({});
                },
            };

            try {
                await window.mParticle.forwarder.use(123);
            } catch (error) {
                error.message.should.equal('Rokt Kit: Invalid extension name');
            }
        });

        it('should log an error when kit is initialized but launcher is missing', async () => {
            const originalConsoleError = window.console.error;
            let errorLogged = false;
            let errorMessage = null;
            window.console.error = function (message) {
                errorLogged = true;
                errorMessage = message;
            };

            window.mParticle.forwarder.isInitialized = true;
            window.mParticle.forwarder.launcher = null;

            try {
                await window.mParticle.forwarder.use('ThankYouPageJourney');
                throw new Error('Expected promise to reject');
            } catch (error) {
                error.message.should.equal('Rokt Kit: Not initialized');
            } finally {
                window.console.error = originalConsoleError;
            }
            errorLogged.should.equal(true);
            errorMessage.should.equal('Rokt Kit: Not initialized');
        });

        it('should call launcher.use after init (test mode) and attach', async () => {
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                Promise.resolve();
            };

            window.Rokt.createLauncher = async function () {
                return Promise.resolve({
                    use: function (name) {
                        window.Rokt.useCalled = true;
                        window.Rokt.useName = name;
                        return Promise.resolve({});
                    },
                });
            };

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            await window.mParticle.forwarder.use('ThankYouPageJourney');

            window.Rokt.useCalled.should.equal(true);
            window.Rokt.useName.should.equal('ThankYouPageJourney');
        });
    });

    describe('#setUserAttribute', () => {
        it('should set the user attribute', async () => {
            window.mParticle.forwarder.setUserAttribute(
                'test-attribute',
                'test-value'
            );

            window.mParticle.forwarder.userAttributes.should.deepEqual({
                'test-attribute': 'test-value',
            });
        });
    });

    describe('#removeUserAttribute', () => {
        it('should remove the user attribute', async () => {
            window.mParticle.forwarder.setUserAttribute(
                'test-attribute',
                'test-value'
            );

            window.mParticle.forwarder.removeUserAttribute('test-attribute');

            window.mParticle.forwarder.userAttributes.should.deepEqual({});
        });
    });

    describe('#onUserIdentified', () => {
        it('should set the filtered user', async () => {
            window.mParticle.forwarder.onUserIdentified({
                getAllUserAttributes: function () {
                    return {
                        'test-attribute': 'test-value',
                    };
                },
                getMPID: function () {
                    return '123';
                },
            });

            window.mParticle.forwarder.userAttributes.should.deepEqual({
                'test-attribute': 'test-value',
            });

            window.mParticle.forwarder.filters.filteredUser
                .getMPID()
                .should.equal('123');
        });
    });

    describe('#fetchOptimizely', () => {
        // Helper functions for setting up Optimizely mocks
        function setupValidOptimizelyMock(experiments) {
            window.optimizely = {
                get: function (key) {
                    if (key === 'state') {
                        return {
                            getActiveExperimentIds: function () {
                                return Object.keys(experiments);
                            },
                            getVariationMap: function () {
                                return experiments;
                            },
                        };
                    }
                },
            };
        }

        function setupInvalidOptimizelyMock(stateObject) {
            window.optimizely = {
                get: function (key) {
                    if (key === 'state') {
                        return stateObject;
                    }
                },
            };
        }

        // Common test setup
        async function initAndSelectPlacements(settings = {}) {
            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    ...settings,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await window.mParticle.forwarder.selectPlacements({
                identifier: 'test-placement',
                attributes: {
                    test: 'test',
                },
            });
        }

        beforeEach(() => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                Promise.resolve();
            };
            window.mParticle.Rokt.setLocalSessionAttribute = function (
                key,
                value
            ) {
                mParticle._Store.localSessionAttributes[key] = value;
            };
            window.mParticle.Rokt.getLocalSessionAttributes = function () {
                return mParticle._Store.localSessionAttributes;
            };
            window.mParticle.forwarder.launcher = {
                selectPlacements: function (options) {
                    window.mParticle.Rokt.selectPlacementsOptions = options;
                    window.mParticle.Rokt.selectPlacementsCalled = true;
                },
            };
            window.mParticle.Rokt.filters = {
                userAttributesFilters: [],
                filterUserAttributes: function (attributes) {
                    return attributes;
                },
                filteredUser: {
                    getMPID: function () {
                        return '123';
                    },
                },
            };
            window.mParticle._getActiveForwarders = function () {
                return [{ name: 'Optimizely' }];
            };
        });

        afterEach(() => {
            delete window.optimizely;
        });

        describe('when Optimizely is properly configured', () => {
            it('should fetch experiment data for single experiment', async () => {
                setupValidOptimizelyMock({
                    exp1: { id: 'var1' },
                });

                await initAndSelectPlacements({
                    onboardingExpProvider: 'Optimizely',
                });

                window.Rokt.selectPlacementsOptions.attributes.should.have.property(
                    'rokt.custom.optimizely.experiment.exp1.variationId',
                    'var1'
                );
            });

            it('should fetch experiment data for multiple experiments', async () => {
                setupValidOptimizelyMock({
                    exp1: { id: 'var1' },
                    exp2: { id: 'var2' },
                });

                await initAndSelectPlacements({
                    onboardingExpProvider: 'Optimizely',
                });

                const attributes =
                    window.Rokt.selectPlacementsOptions.attributes;
                attributes.should.have.property(
                    'rokt.custom.optimizely.experiment.exp1.variationId',
                    'var1'
                );
                attributes.should.have.property(
                    'rokt.custom.optimizely.experiment.exp2.variationId',
                    'var2'
                );
            });
        });

        describe('when Optimizely is not properly configured', () => {
            it('should return empty object when Optimizely is not available', async () => {
                delete window.optimizely;

                await initAndSelectPlacements({
                    onboardingExpProvider: 'Optimizely',
                });

                window.Rokt.selectPlacementsOptions.attributes.should.not.have.property(
                    'rokt.custom.optimizely'
                );
            });

            it('should return empty object when Optimizely state is undefined', async () => {
                setupInvalidOptimizelyMock(undefined);

                await initAndSelectPlacements({
                    onboardingExpProvider: 'Optimizely',
                });

                window.Rokt.selectPlacementsOptions.attributes.should.not.have.property(
                    'rokt.custom.optimizely'
                );
            });

            it('should return empty object when Optimizely state has invalid format', async () => {
                setupInvalidOptimizelyMock({
                    someOtherProperty: 'value',
                    invalidFunction: function () {
                        return null;
                    },
                });

                await initAndSelectPlacements({
                    onboardingExpProvider: 'Optimizely',
                });

                window.Rokt.selectPlacementsOptions.attributes.should.not.have.property(
                    'rokt.custom.optimizely'
                );
            });

            it('should return empty object when Optimizely state is missing required methods', async () => {
                setupInvalidOptimizelyMock({
                    getVariationMap: function () {
                        return {};
                    },
                    // Mocking a scenario for when getActiveExperimentIds() method is missing
                });

                await initAndSelectPlacements({
                    onboardingExpProvider: 'Optimizely',
                });

                window.Rokt.selectPlacementsOptions.attributes.should.not.have.property(
                    'rokt.custom.optimizely'
                );
            });
        });

        describe('when Optimizely is not the provider', () => {
            it('should not fetch Optimizely data', async () => {
                setupValidOptimizelyMock({
                    exp1: { id: 'var1' },
                });

                await initAndSelectPlacements({
                    onboardingExpProvider: 'NotOptimizely',
                });

                window.Rokt.selectPlacementsOptions.attributes.should.not.have.property(
                    'rokt.custom.optimizely'
                );
            });
        });
    });

    describe('#generateLauncherScript', () => {
        const baseUrl = 'https://apps.rokt.com/wsdk/integrations/launcher.js';

        beforeEach(() => {
            window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );
        });

        it('should return base URL when no domain is passed', () => {
            const url =
                window.mParticle.forwarder.testHelpers.generateLauncherScript();
            url.should.equal(baseUrl);
        });

        it('should return an updated base URL with CNAME when domain is passed', () => {
            window.mParticle.forwarder.testHelpers
                .generateLauncherScript('cname.rokt.com')
                .should.equal(
                    'https://cname.rokt.com/wsdk/integrations/launcher.js'
                );
        });

        it('should return base URL when no extensions are provided', () => {
            const url =
                window.mParticle.forwarder.testHelpers.generateLauncherScript();
            url.should.equal(baseUrl);
        });

        it('should return base URL when extensions is null or undefined', () => {
            window.mParticle.forwarder.testHelpers
                .generateLauncherScript(undefined, null)
                .should.equal(baseUrl);

            window.mParticle.forwarder.testHelpers
                .generateLauncherScript(undefined, undefined)
                .should.equal(baseUrl);
        });

        it('should correctly append a single extension', () => {
            const url =
                window.mParticle.forwarder.testHelpers.generateLauncherScript(
                    undefined,
                    ['cos-extension-detection']
                );
            url.should.equal(baseUrl + '?extensions=cos-extension-detection');
        });

        it('should correctly append multiple extensions', () => {
            const url =
                window.mParticle.forwarder.testHelpers.generateLauncherScript(
                    undefined,
                    [
                        'cos-extension-detection',
                        'experiment-monitoring',
                        'sponsored-payments-apple-pay',
                    ]
                );
            url.should.equal(
                baseUrl +
                    '?extensions=cos-extension-detection,' +
                    'experiment-monitoring,' +
                    'sponsored-payments-apple-pay'
            );
        });
    });

    describe('#roktExtensions', () => {
        beforeEach(async () => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );
        });

        describe('extractRoktExtensions', () => {
            it('should correctly map known extension names to their query parameters', async () => {
                const settingsString =
                    '[{&quot;jsmap&quot;:null,&quot;map&quot;:null,&quot;maptype&quot;:&quot;StaticList&quot;,&quot;value&quot;:&quot;cos-extension-detection&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:null,&quot;maptype&quot;:&quot;StaticList&quot;,&quot;value&quot;:&quot;experiment-monitoring&quot;}]';
                const expectedExtensions = [
                    'cos-extension-detection',
                    'experiment-monitoring',
                ];

                window.mParticle.forwarder.testHelpers
                    .extractRoktExtensions(settingsString)
                    .should.deepEqual(expectedExtensions);
            });
        });

        it('should handle invalid setting strings', () => {
            window.mParticle.forwarder.testHelpers
                .extractRoktExtensions('NONE')
                .should.deepEqual([]);

            window.mParticle.forwarder.testHelpers
                .extractRoktExtensions(undefined)
                .should.deepEqual([]);

            window.mParticle.forwarder.testHelpers
                .extractRoktExtensions(null)
                .should.deepEqual([]);
        });
    });

    describe('#generateMappedEventLookup', () => {
        beforeEach(async () => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );
        });

        it('should generate a lookup table from a placement event mapping', () => {
            const placementEventMapping = [
                {
                    jsmap: '-1484452948',
                    map: '-5208850776883573773',
                    maptype: 'EventClass.Id',
                    value: 'foo-mapped-flag',
                },
                {
                    jsmap: '1838502119',
                    map: '1324617889422969328',
                    maptype: 'EventClass.Id',
                    value: 'ad_viewed_test',
                },
            ];

            window.mParticle.forwarder.testHelpers
                .generateMappedEventLookup(placementEventMapping)
                .should.deepEqual({
                    '-1484452948': 'foo-mapped-flag',
                    1838502119: 'ad_viewed_test',
                });
        });

        it('should return an empty object if the placement event mapping is null', () => {
            window.mParticle.forwarder.testHelpers
                .generateMappedEventLookup(null)
                .should.deepEqual({});
        });
    });

    describe('#generateMappedEventAttributeLookup', () => {
        beforeEach(async () => {
            window.Rokt = new MockRoktForwarder();
            window.mParticle.Rokt = window.Rokt;

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true
            );
        });

        it('should generate a lookup table from placementEventAttributeMapping', () => {
            const placementEventAttributeMapping = [
                {
                    jsmap: null,
                    map: 'number_of_products',
                    maptype: 'EventAttributeClass.Name',
                    value: 'tof_products_2',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: 2,
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'saleSeeker',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: 'sale',
                        },
                    ],
                },
            ];

            window.mParticle.forwarder.testHelpers
                .generateMappedEventAttributeLookup(
                    placementEventAttributeMapping
                )
                .should.deepEqual({
                    tof_products_2: [
                        {
                            eventAttributeKey: 'number_of_products',
                            conditions: [
                                {
                                    operator: 'equals',
                                    attributeValue: 2,
                                },
                            ],
                        },
                    ],
                    saleSeeker: [
                        {
                            eventAttributeKey: 'URL',
                            conditions: [
                                {
                                    operator: 'contains',
                                    attributeValue: 'sale',
                                },
                            ],
                        },
                    ],
                });
        });

        it('should default conditions to an empty array when missing', () => {
            const placementEventAttributeMapping = [
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'hasUrl',
                },
            ];

            window.mParticle.forwarder.testHelpers
                .generateMappedEventAttributeLookup(
                    placementEventAttributeMapping
                )
                .should.deepEqual({
                    hasUrl: [
                        {
                            eventAttributeKey: 'URL',
                            conditions: [],
                        },
                    ],
                });
        });

        it('should return an empty object when placementEventAttributeMapping is null', () => {
            window.mParticle.forwarder.testHelpers
                .generateMappedEventAttributeLookup(null)
                .should.deepEqual({});
        });

        it('should ignore invalid mappings (non-string map/value)', () => {
            const placementEventAttributeMapping = [
                {
                    jsmap: null,
                    map: null,
                    maptype: 'EventAttributeClass.Name',
                    value: 'bad',
                    conditions: [],
                },
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: null,
                    conditions: [],
                },
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'good',
                    conditions: [],
                },
            ];

            window.mParticle.forwarder.testHelpers
                .generateMappedEventAttributeLookup(
                    placementEventAttributeMapping
                )
                .should.deepEqual({
                    good: [
                        {
                            eventAttributeKey: 'URL',
                            conditions: [],
                        },
                    ],
                });
        });
    });

    describe('#processEvent', () => {
        beforeEach(() => {
            window.Rokt = new MockRoktForwarder();
            window.Rokt.createLauncher = async function () {
                return Promise.resolve({
                    selectPlacements: function (options) {
                        window.mParticle.Rokt.selectPlacementsOptions = options;
                        window.mParticle.Rokt.selectPlacementsCalled = true;
                    },
                });
            };
            window.mParticle.Rokt = window.Rokt;
            window.mParticle.Rokt.attachKitCalled = false;
            window.mParticle.Rokt.attachKit = async (kit) => {
                window.mParticle.Rokt.attachKitCalled = true;
                window.mParticle.Rokt.kit = kit;
                Promise.resolve();
            };
            window.mParticle.Rokt.setLocalSessionAttribute = function (
                key,
                value
            ) {
                window.mParticle._Store.localSessionAttributes[key] = value;
            };
            window.mParticle.Rokt.getLocalSessionAttributes = function () {
                return window.mParticle._Store.localSessionAttributes;
            };
            window.mParticle.forwarder.launcher = {
                selectPlacements: function (options) {
                    window.mParticle.Rokt.selectPlacementsOptions = options;
                    window.mParticle.Rokt.selectPlacementsCalled = true;
                },
            };
            window.mParticle.Rokt.filters = {
                userAttributesFilters: [],
                filterUserAttributes: function (attributes) {
                    return attributes;
                },
                filteredUser: {
                    getMPID: function () {
                        return '123';
                    },
                },
            };
        });

        afterEach(() => {
            window.mParticle.forwarder.eventQueue = [];
            window.mParticle.forwarder.isInitialized = false;
            window.mParticle.Rokt.attachKitCalled = false;
        });

        it('set a local session selection attribute if the event is a mapped placement event', async () => {
            // Mocks hashed values for testing
            const placementEventMapping = JSON.stringify([
                {
                    jsmap: 'hashed-<48Video Watched>-value',
                    map: '123466',
                    maptype: 'EventClass.Id',
                    value: 'foo-mapped-flag',
                },
                {
                    jsmap: 'hashed-<29Other Value>-value',
                    map: '1279898989',
                    maptype: 'EventClass.Id',
                    value: 'ad_viewed_test',
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle.forwarder.process({
                EventName: 'Video Watched',
                EventCategory: EventType.Other,
                EventDataType: MessageType.PageEvent,
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                'foo-mapped-flag': true,
            });
        });

        it('should set local session attribute only when placementEventAttributeMapping conditions match (URL contains)', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'saleSeeker',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: 'sale',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/home',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({});

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/sale/items',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                saleSeeker: true,
            });
        });
        it('should support event attribute mapping when conditions are not defined', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'hasUrl',
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/anything',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                hasUrl: true,
            });
        });

        it('should not set local session attribute when mapped attribute key is missing from event and no conditions have been defined', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'hasUrl',
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    someOtherAttribute: 'value',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({});
        });

        it('should support exists operator for placementEventAttributeMapping conditions', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'hasUrl',
                    conditions: [{ operator: 'exists' }],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/anything',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                hasUrl: true,
            });

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    someOtherAttribute: 'value',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({});
        });

        it('should evaluate equals for placementEventAttributeMapping conditions', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'number_of_products',
                    maptype: 'EventAttributeClass.Name',
                    value: 'multipleproducts',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: 2,
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    number_of_products: 2,
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                multipleproducts: true,
            });

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    number_of_products: '2',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                multipleproducts: true,
            });
        });

        it('should evaluate contains for placementEventAttributeMapping conditions', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'number_of_products',
                    maptype: 'EventAttributeClass.Name',
                    value: 'containsNumber',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: '2',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    number_of_products: 2,
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                containsNumber: true,
            });
        });

        it('should correctly match attribute values for different type cases', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'boolAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'lowerCaseMatches',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: 'true',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'boolAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'titleCaseMatches',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: 'True',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'boolAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'upperCaseMatches',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: 'TRUE',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'zeroAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'falseMatches',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: false,
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'zeroAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'emptyMatches',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: '',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'zeroAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'zeroMatches',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: '0',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'numAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'digitMatches',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: '2',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Test',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    boolAttr: true,
                    zeroAttr: 0,
                    numAttr: 123,
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                lowerCaseMatches: true,
                zeroMatches: true,
                digitMatches: true,
            });
        });

        it('should not match when attribute key is missing or EventAttributes is absent', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'missingAttr',
                    maptype: 'EventAttributeClass.Name',
                    value: 'shouldNotMatch',
                    conditions: [
                        {
                            operator: 'equals',
                            attributeValue: 'testValue',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Test',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    otherAttr: 'value',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({});

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Test',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({});
        });

        it('should require ALL rules for the same mapped key to match (AND across rules)', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'saleSeeker',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: 'sale',
                        },
                        {
                            operator: 'exists',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'saleSeeker',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: 'items',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/sale',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({});

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/sale/items',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                saleSeeker: true,
            });
        });
        it('should set multiple local session attributes for the same event attribute key', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'saleSeeker',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: 'sale',
                        },
                    ],
                },
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'saleSeeker1',
                    conditions: [
                        {
                            operator: 'contains',
                            attributeValue: 'items',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/sale',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                saleSeeker: true,
            });

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/sale/items',
                },
            });
            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                saleSeeker: true,
                saleSeeker1: true,
            });
        });
        it('should treat falsy attribute values as existing', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'zeroProp',
                    maptype: 'EventAttributeClass.Name',
                    value: 'zeroExists',
                    conditions: [{ operator: 'exists' }],
                },
                {
                    jsmap: null,
                    map: 'falseProp',
                    maptype: 'EventAttributeClass.Name',
                    value: 'falseExists',
                    conditions: [{ operator: 'exists' }],
                },
                {
                    jsmap: null,
                    map: 'emptyStringProp',
                    maptype: 'EventAttributeClass.Name',
                    value: 'emptyStringExists',
                    conditions: [{ operator: 'exists' }],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Test',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    zeroProp: 0,
                    falseProp: false,
                    emptyStringProp: '',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                zeroExists: true,
                falseExists: true,
                emptyStringExists: true,
            });
        });

        it('should not match when condition has an unrecognized operator', async () => {
            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'shouldNotMatch',
                    conditions: [
                        {
                            operator: 'testOperator',
                            attributeValue: 'https',
                        },
                    ],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({});
        });

        it('should support both placementEventMapping and placementEventAttributeMapping together', async () => {
            const placementEventMapping = JSON.stringify([
                {
                    jsmap: 'hashed-<48Video Watched>-value',
                    map: '123466',
                    maptype: 'EventClass.Id',
                    value: 'foo-mapped-flag',
                },
            ]);

            const placementEventAttributeMapping = JSON.stringify([
                {
                    jsmap: null,
                    map: 'URL',
                    maptype: 'EventAttributeClass.Name',
                    value: 'hasUrl',
                    conditions: [{ operator: 'exists' }],
                },
            ]);

            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                    placementEventMapping,
                    placementEventAttributeMapping,
                },
                reportService.cb,
                true,
                null,
                {}
            );

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Browse',
                EventCategory: EventType.Unknown,
                EventDataType: MessageType.PageView,
                EventAttributes: {
                    URL: 'https://example.com/anything',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                hasUrl: true,
            });

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Video Watched',
                EventCategory: EventType.Other,
                EventDataType: MessageType.PageEvent,
                EventAttributes: {
                    URL: 'https://example.com/video',
                },
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                hasUrl: true,
                'foo-mapped-flag': true,
            });

            window.mParticle._Store.localSessionAttributes = {};
            window.mParticle.forwarder.process({
                EventName: 'Video Watched',
                EventCategory: EventType.Other,
                EventDataType: MessageType.PageEvent,
            });

            window.mParticle._Store.localSessionAttributes.should.deepEqual({
                'foo-mapped-flag': true,
            });
        });

        it('should add the event to the event queue if the kit is not initialized', async () => {
            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.forwarder.process({
                EventName: 'Video Watched A',
                EventCategory: EventType.Other,
                EventDataType: MessageType.PageEvent,
            });

            window.mParticle.forwarder.eventQueue.should.deepEqual([
                {
                    EventName: 'Video Watched A',
                    EventCategory: EventType.Other,
                    EventDataType: MessageType.PageEvent,
                },
            ]);
        });

        it('should process queued events once the kit is ready', async () => {
            await window.mParticle.forwarder.init(
                {
                    accountId: '123456',
                },
                reportService.cb,
                true,
                null,
                {}
            );

            window.mParticle.forwarder.process({
                EventName: 'Video Watched B',
                EventCategory: EventType.Other,
                EventDataType: MessageType.PageEvent,
            });

            window.mParticle.forwarder.eventQueue.should.deepEqual([
                {
                    EventName: 'Video Watched B',
                    EventCategory: EventType.Other,
                    EventDataType: MessageType.PageEvent,
                },
            ]);

            await waitForCondition(() => window.mParticle.Rokt.attachKitCalled);

            window.mParticle.forwarder.eventQueue.should.deepEqual([]);
        });
    });

    describe('#parseSettingsString', () => {
        it('should parse null values in a settings string appropriately', () => {
            const settingsString =
                '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;f.name&quot;,&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;firstname&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;last_name&quot;,&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;lastname&quot;}]';

            window.mParticle.forwarder.testHelpers
                .parseSettingsString(settingsString)
                .should.deepEqual([
                    {
                        jsmap: null,
                        map: 'f.name',
                        maptype: 'UserAttributeClass.Name',
                        value: 'firstname',
                    },
                    {
                        jsmap: null,
                        map: 'last_name',
                        maptype: 'UserAttributeClass.Name',
                        value: 'lastname',
                    },
                ]);
        });

        it('should convert jmap and map number values to stringified numbers when parsed', () => {
            const settingsString =
                '[{&quot;jsmap&quot;:&quot;-1484452948&quot;,&quot;map&quot;:&quot;-5208850776883573773&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;abc&quot;},{&quot;jsmap&quot;:&quot;1838502119&quot;,&quot;map&quot;:&quot;1324617889422969328&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;bcd&quot;},{&quot;jsmap&quot;:&quot;-355458063&quot;,&quot;map&quot;:&quot;5878452521714063084&quot;,&quot;maptype&quot;:&quot;EventClass.Id&quot;,&quot;value&quot;:&quot;card_viewed_test&quot;}]';

            window.mParticle.forwarder.testHelpers
                .parseSettingsString(settingsString)
                .should.deepEqual([
                    {
                        jsmap: '-1484452948',
                        map: '-5208850776883573773',
                        maptype: 'EventClass.Id',
                        value: 'abc',
                    },
                    {
                        jsmap: '1838502119',
                        map: '1324617889422969328',
                        maptype: 'EventClass.Id',
                        value: 'bcd',
                    },
                    {
                        jsmap: '-355458063',
                        map: '5878452521714063084',
                        maptype: 'EventClass.Id',
                        value: 'card_viewed_test',
                    },
                ]);
        });

        it('returns an empty array if the settings string is empty', () => {
            const settingsString = '';

            window.mParticle.forwarder.testHelpers
                .parseSettingsString(settingsString)
                .should.deepEqual([]);
        });

        it('returns an empty array if the settings string is not a valid JSON', () => {
            const settingsString = 'not a valid JSON';

            window.mParticle.forwarder.testHelpers
                .parseSettingsString(settingsString)
                .should.deepEqual([]);
        });
    });

    describe('#hashEventMessage', () => {
        it('should hash event message using generateHash in the proper order', () => {
            const eventName = 'Test Event';
            const eventType = EventType.Other;
            const messageType = MessageType.PageEvent;
            const resultHash =
                window.mParticle.forwarder.testHelpers.hashEventMessage(
                    messageType,
                    eventType,
                    eventName
                );

            // Order should be messageType (4), eventType (8), eventName (Test Event)
            resultHash.should.equal('hashed-<48Test Event>-value');
        });
    });
});

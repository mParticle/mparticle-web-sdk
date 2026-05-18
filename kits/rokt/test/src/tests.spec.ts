import packageJson from '../../package.json';
const packageVersion = packageJson.version;
import '../../src/Rokt-Kit';
import { Batch } from '@mparticle/web-sdk/internal';

/* eslint-disable @typescript-eslint/no-explicit-any */

declare const mParticle: any;

const sdkVersion = 'mParticle_wsdkv_1.2.3';
const kitVersion = 'kitv_' + packageVersion;

const waitForCondition = async (conditionFn: () => boolean, timeout = 200, interval = 10) => {
  return new Promise<void>((resolve, reject) => {
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
  // Reporting service classes from testHelpers (populated after kit init)
  let _ReportingTransportClass: any;
  let ErrorReportingServiceClass: any;
  let LoggingServiceClass: any;
  let RateLimiterClass: any;
  let ErrorCodesConst: any;
  let WSDKErrorSeverityConst: any;

  const EventType = {
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
  const MessageType = {
    SessionStart: 1,
    SessionEnd: 2,
    PageView: 3,
    PageEvent: 4,
    CrashReport: 5,
    OptOut: 6,
    Commerce: 16,
  };
  const ReportingService = function (this: any) {
    const self = this;

    this.id = null;
    this.event = null;

    this.cb = function (forwarder: any, event: any) {
      self.id = forwarder.id;
      self.event = event;
    };

    this.reset = function () {
      this.id = null;
      this.event = null;
    };
  };
  const reportService = new (ReportingService as any)();

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
  mParticle.sessionManager = {
    getSession: function () {
      return 'test-mp-session-id';
    },
  };
  mParticle._getActiveForwarders = function () {
    return [];
  };
  mParticle.generateHash = function (input: any) {
    return 'hashed-<' + input + '>-value';
  };
  // Mock for logEvent to capture custom event logging
  mParticle.loggedEvents = [];
  mParticle.logEvent = function (eventName: any, eventType: any, eventAttributes: any) {
    mParticle.loggedEvents.push({
      eventName: eventName,
      eventType: eventType,
      eventAttributes: eventAttributes,
    });
  };
  // -------------------START EDITING BELOW:-----------------------
  const MockRoktForwarder = function (this: any) {
    const self = this;

    this.initializeCalled = false;
    this.isInitialized = false;
    this.accountId = null;
    this.sandbox = null;
    this.integrationName = null;
    this.createLauncherCalled = false;
    this.createLocalLauncherCalled = false;

    this.createLauncher = function (options: any) {
      self.accountId = options.accountId;
      self.integrationName = options.integrationName;
      self.noFunctional = options.noFunctional;
      self.noTargeting = options.noTargeting;
      self.mpSessionId = options.mpSessionId;
      self.createLauncherCalled = true;
      self.isInitialized = true;
      self.sandbox = options.sandbox;

      return Promise.resolve({
        selectPlacements: function (opts: any) {
          self.selectPlacementsOptions = opts;
          self.selectPlacementsCalled = true;
        },
        hashAttributes: function () {
          throw new Error('hashAttributes not implemented');
        },
        use: function () {
          return Promise.resolve();
        },
        onShoppableAdsReady: function () {},
      });
    };

    this.createLocalLauncher = function (options: any) {
      self.accountId = options.accountId;
      self.integrationName = options.integrationName;
      self.noFunctional = options.noFunctional;
      self.noTargeting = options.noTargeting;
      self.mpSessionId = options.mpSessionId;
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

  beforeAll(async () => {
    (window as any).Rokt = new (MockRoktForwarder as any)();
    (window as any).mParticle.Rokt = (window as any).Rokt;
    (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
      (window as any).mParticle.Rokt.kit = kit;
    };
    (window as any).mParticle.Rokt.filters = {
      userAttributesFilters: [],
      filterUserAttributes: function (attributes: any) {
        return attributes;
      },
      filteredUser: {
        getMPID: function () {
          return '123';
        },
      },
    };
    await mParticle.forwarder.init({ accountId: '000000' }, reportService.cb, true, null, {});

    const testHelpers = (window as any).mParticle.forwarder.testHelpers;
    _ReportingTransportClass = testHelpers?.ReportingTransport;
    ErrorReportingServiceClass = testHelpers?.ErrorReportingService;
    LoggingServiceClass = testHelpers?.LoggingService;
    RateLimiterClass = testHelpers?.RateLimiter;
    ErrorCodesConst = testHelpers?.ErrorCodes;
    WSDKErrorSeverityConst = testHelpers?.WSDKErrorSeverity;
  });

  beforeEach(() => {
    (window as any).Rokt = new (MockRoktForwarder as any)();
    (window as any).mParticle.Rokt = (window as any).Rokt;
    (window as any).mParticle.Rokt.flushOnShoppableAdsReadyMessageQueue = () => {};
  });

  afterEach(() => {
    (window as any).mParticle.forwarder.userAttributes = {};
    delete (window as any).mParticle.forwarder.launcherOptions;
    delete (window as any).mParticle.Rokt.launcherOptions;
  });

  describe('#initForwarder', () => {
    beforeEach(() => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
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
        {},
      );

      expect((window as any).Rokt.accountId).toBe('123456');
      expect((window as any).Rokt.createLauncherCalled).toBe(true);
    });

    it('should set sandbox to true if sandbox is true in launcherOptions', async () => {
      (window as any).mParticle.Rokt.launcherOptions = {
        sandbox: true,
      };

      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );

      expect((window as any).Rokt.createLauncherCalled).toBe(true);
      expect((window as any).Rokt.sandbox).toBe(true);
    });

    it('should set sandbox to false if sandbox is false in launcherOptions', async () => {
      (window as any).mParticle.Rokt.launcherOptions = {
        sandbox: false,
      };

      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );

      expect((window as any).Rokt.createLauncherCalled).toBe(true);
      expect((window as any).Rokt.sandbox).toBe(false);
    });

    it('should set optional settings from launcherOptions', async () => {
      (window as any).mParticle.Rokt.launcherOptions = {
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
        null,
      );

      const expectedIntegrationName = `${sdkVersion}_${kitVersion}_customName`;

      expect((window as any).Rokt.createLauncherCalled).toBe(true);
      expect((window as any).Rokt.accountId).toBe('123456');
      expect((window as any).Rokt.integrationName).toBe(expectedIntegrationName);
      expect((window as any).Rokt.noFunctional).toBe(true);
      expect((window as any).Rokt.noTargeting).toBe(true);
    });

    it('should set the filters on the forwarder', async () => {
      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
        null,
        {},
      );

      // Wait for initialization to complete (after launcher is created)
      await waitForCondition(() => {
        return (window as any).mParticle.forwarder.isInitialized;
      });

      // kit.filters is the same reference as window.mParticle.Rokt.filters
      expect((window as any).mParticle.Rokt.kit.filters).toBe((window as any).mParticle.Rokt.filters);

      expect((window as any).mParticle.Rokt.kit.filters.filteredUser.getMPID()).toBe('123');
    });

    it('should set integrationName in the correct format', async () => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async () => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        return Promise.resolve();
      };

      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );

      expect((window as any).Rokt.integrationName).toBe(`${sdkVersion}_${kitVersion}`);
    });

    it('should set integrationName on kit instance after attaching', async () => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;

      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        return Promise.resolve();
      };

      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );

      // Wait for initialization to complete
      await waitForCondition(() => (window as any).mParticle.Rokt.isInitialized);

      expect((window as any).mParticle.Rokt.kit.integrationName).toBe(`${sdkVersion}_${kitVersion}`);
    });

    it('should set integrationName on kit instance with custom name when provided', async () => {
      const customName = 'myCustomName';

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;

      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        return Promise.resolve();
      };

      (window as any).mParticle.Rokt.launcherOptions = {
        integrationName: customName,
      };

      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );

      // Wait for initialization to complete
      await waitForCondition(() => (window as any).mParticle.Rokt.isInitialized);

      expect((window as any).mParticle.Rokt.kit.integrationName).toBe(`${sdkVersion}_${kitVersion}_${customName}`);
    });

    it('should have integrationName available on kit after initialization', async () => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;

      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        return Promise.resolve();
      };

      await mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );

      // Wait for initialization to complete
      await waitForCondition(() => (window as any).mParticle.Rokt.isInitialized);

      expect((window as any).mParticle.Rokt.attachKitCalled).toBe(true);
      expect(typeof (window as any).mParticle.Rokt.kit.integrationName).toBe('string');
      expect((window as any).mParticle.Rokt.kit.integrationName).toBeTruthy();
    });

    it('should not mutate the global launcherOptions object during initialization', async () => {
      const originalIntegrationName = 'globalIntegrationName';

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async () => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        return Promise.resolve();
      };

      // Set up the global launcherOptions with a custom integration name
      (window as any).mParticle.Rokt.launcherOptions = {
        integrationName: originalIntegrationName,
        sandbox: true,
      };

      // Store reference to verify it doesn't get mutated
      const originalLauncherOptions = (window as any).mParticle.Rokt.launcherOptions;

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
        null,
      );

      expect(originalLauncherOptions.integrationName).toBe('globalIntegrationName');
      expect(originalLauncherOptions.sandbox).toBe(true);

      // Verify the kit still gets the processed integration name
      const expectedProcessedName = `${sdkVersion}_${kitVersion}_${originalIntegrationName}`;
      expect((window as any).Rokt.integrationName).toBe(expectedProcessedName);
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
        {},
      );

      // Wait for initialization to complete (after launcher is created)
      await waitForCondition(() => (window as any).mParticle.Rokt.isInitialized);

      expect((window as any).mParticle.forwarder.placementEventMappingLookup).toEqual({
        '-1484452948': 'foo-mapped-flag',
        1838502119: 'ad_viewed_test',
      });
    });
  });

  describe('#hashAttributes', () => {
    beforeEach(() => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.forwarder.launcher = {
        hashAttributes: function (attributes: any) {
          // Mocking the hashAttributes method to show that
          // the attributes will be transformed by the launcher's
          // hashAttributes method.
          const hashedAttributes: any = {};
          for (const key in attributes) {
            if (attributes.hasOwnProperty(key)) {
              hashedAttributes[key + '-hash'] = 'hashed-' + attributes[key];
            }
          }
          (window as any).mParticle.Rokt.hashedAttributes = hashedAttributes;
          (window as any).mParticle.Rokt.hashAttributesCalled = true;

          return Promise.resolve(hashedAttributes);
        },
      };
    });

    it('should call launcher.hashAttributes with passed through attributes when fully initialized', function () {
      // Ensure both initialization conditions are met
      (window as any).mParticle.forwarder.isInitialized = true;
      (window as any).mParticle.forwarder.launcher = {
        hashAttributes: function (attributes: any) {
          (window as any).mParticle.Rokt.hashAttributesOptions = attributes;
          (window as any).mParticle.Rokt.hashAttributesCalled = true;
          return {
            'test-attribute': 'hashed-value',
          };
        },
      };

      const attributes = {
        'test-attribute': 'test-value',
      };

      (window as any).mParticle.forwarder.hashAttributes(attributes);

      expect((window as any).Rokt.hashAttributesCalled).toBe(true);
      expect((window as any).Rokt.hashAttributesOptions).toEqual(attributes);
    });

    it('should return null when launcher exists but kit is not initialized', function () {
      // Set launcher but ensure isInitialized is false
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.forwarder.launcher = {
        hashAttributes: function () {},
      };

      const result = (window as any).mParticle.forwarder.hashAttributes({
        'test-attribute': 'test-value',
      });

      expect(result).toBeNull();
    });

    it('should log an error when called before initialization', function () {
      let errorLogged = false;
      let errorMessage = null;
      window.console.error = function (message: any) {
        errorLogged = true;
        errorMessage = message;
      };

      // Ensure kit is not initialized
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.forwarder.launcher = null;

      (window as any).mParticle.forwarder.hashAttributes({
        'test-attribute': 'test-value',
      });

      expect(errorLogged).toBe(true);
      expect(errorMessage).toBe('Rokt Kit: Not initialized');
    });

    it('should return null when kit is initialized but launcher is missing', function () {
      // Mock isInitialized but remove launcher
      (window as any).mParticle.forwarder.isInitialized = true;
      (window as any).mParticle.forwarder.launcher = null;

      const result = (window as any).mParticle.forwarder.hashAttributes({
        'test-attribute': 'test-value',
      });

      expect(result).toBeNull();
    });

    it('should log an error when kit is initialized but launcher is missing', function () {
      let errorLogged = false;
      let errorMessage = null;
      window.console.error = function (message: any) {
        errorLogged = true;
        errorMessage = message;
      };

      (window as any).mParticle.forwarder.isInitialized = true;
      (window as any).mParticle.forwarder.launcher = null;

      (window as any).mParticle.forwarder.hashAttributes({
        'test-attribute': 'test-value',
      });

      expect(errorLogged).toBe(true);
      expect(errorMessage).toBe('Rokt Kit: Not initialized');
    });

    it('should return hashed attributes from launcher', async () => {
      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
        null,
        {},
      );

      const result = await (window as any).mParticle.forwarder.hashAttributes({
        'test-attribute': 'test-value',
      });

      expect(result).toEqual({
        'test-attribute-hash': 'hashed-test-value',
      });
    });
  });

  describe('#attachLauncher', () => {
    let mockMessageQueue: any[];

    beforeEach(() => {
      mockMessageQueue = [];

      // Reset forwarder state between tests
      (window as any).mParticle.forwarder.isInitialized = false;

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;

      // Ensure currentLauncher is undefined to trigger script appending
      (window as any).Rokt.currentLauncher = undefined;

      // Set attachKit as async to allow for await calls in the test
      // This is necessary to simiulate a race condition between the
      // core sdk and the Rokt forwarder
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;

        // Call queued messages
        mockMessageQueue.forEach((message) => message());
        mockMessageQueue = [];

        return Promise.resolve();
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
          return attributes;
        },
        filteredUser: {
          getMPID: function () {
            return '123';
          },
        },
      };
      (window as any).mParticle.config = undefined;
      Math.random = () => 1;

      (window as any).mParticle.captureTiming = function (metricName: any) {
        (window as any).mParticle.Rokt.capturedPerformanceMetric = metricName;
      };
    });

    it('should add a performance marker when the script is appended', async () => {
      const savedRokt = (window as any).mParticle.Rokt;
      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt = {
        domain: 'apps.rokt.com',
        attachKit: async () => Promise.resolve(),
        filters: savedRokt.filters,
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, false, null, {});

      expect((window as any).mParticle.Rokt.capturedPerformanceMetric).toBe('mp:RoktScriptAppended');
    });

    it('should create a remote launcher if the partner is not in the local launcher test group', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.Rokt.createLauncherCalled).toBe(true);
      expect((window as any).mParticle.Rokt.createLocalLauncherCalled).toBe(false);
    });

    it('should create a local launcher if the partner is in the local launcher test group', async () => {
      (window as any).mParticle.config = {
        isLocalLauncherEnabled: true,
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.Rokt.createLauncherCalled).toBe(false);
      expect((window as any).mParticle.Rokt.createLocalLauncherCalled).toBe(true);
    });

    it('should create a remote launcher if the partner is in the local launcher test group but the random number is below the thresholds', async () => {
      (window as any).mParticle.config = {
        isLocalLauncherEnabled: true,
      };

      Math.random = () => 0;

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.Rokt.createLauncherCalled).toBe(true);
      expect((window as any).mParticle.Rokt.createLocalLauncherCalled).toBe(false);
    });

    it('should create a local launcher if the partner is in the local launcher test group but the random number is above the thresholds', async () => {
      (window as any).mParticle.config = {
        isLocalLauncherEnabled: true,
      };

      Math.random = () => 1;

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.Rokt.createLauncherCalled).toBe(false);
      expect((window as any).mParticle.Rokt.createLocalLauncherCalled).toBe(true);
    });

    it('should call attachKit', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect((window as any).mParticle.Rokt.attachKitCalled).toBe(true);
    });

    it('should set isInitialized to true', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect((window as any).mParticle.forwarder.isInitialized).toBe(true);
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
        wasKitInitializedFirst = (window as any).mParticle.Rokt.kit && (window as any).mParticle.Rokt.kit.isInitialized;
        queuedMessageCalled = true;
      };

      mockMessageQueue.push(queuedMessage);

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.forwarder.isInitialized).toBe(false);
      expect(queuedMessageCalled).toBe(false);

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect((window as any).mParticle.forwarder.isInitialized).toBe(true);
      expect(queuedMessageCalled).toBe(true);

      expect(wasKitInitializedFirst).toBe(true);

      expect(mockMessageQueue.length).toBe(0);
    });

    it('should call createLauncher when launcher is embedded and not yet initialized', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, false, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect((window as any).mParticle.Rokt.createLauncherCalled).toBe(true);
    });

    it('should pass mpSessionId from mParticle sessionManager to createLauncher', async () => {
      (window as any).mParticle.sessionManager = {
        getSession: function () {
          return 'my-mp-session-123';
        },
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.Rokt.mpSessionId).toBe('my-mp-session-123');
    });

    it('should not pass mpSessionId when sessionManager is unavailable', async () => {
      delete (window as any).mParticle.sessionManager;

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.Rokt.mpSessionId).toBeUndefined();
    });
  });

  describe('#selectPlacements', () => {
    beforeEach(() => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKit = async () => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        return Promise.resolve();
      };
      mParticle.loggedEvents = [];
      (window as any).mParticle.Rokt.setLocalSessionAttribute = function (key: any, value: any) {
        mParticle._Store.localSessionAttributes[key] = value;
      };
      (window as any).mParticle.Rokt.getLocalSessionAttributes = function () {
        return mParticle._Store.localSessionAttributes;
      };
      (window as any).mParticle.Rokt.store = (window as any).mParticle._Store;
      (window as any).mParticle.Rokt.store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.launcher = {
        selectPlacements: function (options: any) {
          (window as any).mParticle.Rokt.selectPlacementsOptions = options;
          (window as any).mParticle.Rokt.selectPlacementsCalled = true;
        },
      };
      (window as any).mParticle.forwarder.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
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
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            test: 'test',
          },
        });

        expect((window as any).Rokt.selectPlacementsCalled).toBe(true);
        expect((window as any).Rokt.selectPlacementsOptions).toEqual({
          identifier: 'test-placement',
          attributes: {
            test: 'test',
            mpid: '123',
          },
        });
      });

      it('should collect mpid and send to launcher.selectPlacements', async () => {
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'user-attribute': 'user-attribute-value',
          },
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'user-attribute': 'user-attribute-value',
          },
        });

        expect((window as any).Rokt.selectPlacementsCalled).toBe(true);
        expect((window as any).Rokt.selectPlacementsOptions).toEqual({
          identifier: 'test-placement',
          attributes: {
            'user-attribute': 'user-attribute-value',
            mpid: '123',
          },
        });
      });

      it('should collect local session attributes and send to launcher.selectPlacements', async () => {
        (window as any).mParticle.Rokt.store.localSessionAttributes = {
          'custom-local-attribute': true,
          'secondary-local-attribute': true,
        };

        await (window as any).mParticle.forwarder.init(
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
          true,
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'test-attribute': 'test-value',
          },
        });

        expect((window as any).Rokt.selectPlacementsCalled).toBe(true);
        expect((window as any).Rokt.selectPlacementsOptions).toEqual({
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
        console.error = function (message: any) {
          if (message && message.indexOf && message.indexOf('Error getting local session attributes') !== -1) {
            errorLogged = true;
          }
          originalConsoleError.apply(console, arguments as any);
        };

        delete (window as any).mParticle.Rokt.getLocalSessionAttributes;

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'test-attribute': 'test-value',
          },
        });

        expect(errorLogged).toBe(false);

        console.error = originalConsoleError;
      });
    });

    describe('User Attributes', () => {
      it('should call launcher.selectPlacements with filtered user attributes', async () => {
        (window as any).mParticle.forwarder.filters.filterUserAttributes = function () {
          return {
            'user-attribute': 'user-attribute-value',
            'unfiltered-attribute': 'unfiltered-value',
          };
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'unfiltered-attribute': 'unfiltered-value',
            'filtered-attribute': 'filtered-value',
          },
        });

        expect((window as any).Rokt.selectPlacementsCalled).toBe(true);
        expect((window as any).Rokt.selectPlacementsOptions).toEqual({
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
        (window as any).mParticle.forwarder.filters.filterUserAttributes = function () {
          return {
            'user-attribute': 'user-attribute-value',
            'unfiltered-attribute': 'unfiltered-value',
            'changed-attribute': 'new-value',
          };
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            // These should be filtered out
            'blocked-attribute': 'blocked-value',
            'initial-user-attribute': 'initial-user-attribute-value',

            // This should be updated
            'changed-attribute': 'old-value',
          },
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            // This should pass through
            'unfiltered-attribute': 'unfiltered-value',

            // This should be filtered out
            'filtered-attribute': 'filtered-value',
          },
        });

        expect((window as any).Rokt.selectPlacementsCalled).toBe(true);
        expect((window as any).Rokt.selectPlacementsOptions).toEqual({
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
        (window as any).Rokt = new (MockRoktForwarder as any)();
        (window as any).mParticle.Rokt = (window as any).Rokt;
        (window as any).mParticle.Rokt.attachKitCalled = false;
        (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
          (window as any).mParticle.Rokt.attachKitCalled = true;
          (window as any).mParticle.Rokt.kit = kit;
          Promise.resolve();
        };
        (window as any).mParticle.Rokt.setLocalSessionAttribute = function (key: any, value: any) {
          mParticle._Store.localSessionAttributes[key] = value;
        };
        (window as any).mParticle.Rokt.getLocalSessionAttributes = function () {
          return mParticle._Store.localSessionAttributes;
        };
        (window as any).mParticle.forwarder.launcher = {
          selectPlacements: function (options: any) {
            (window as any).mParticle.Rokt.selectPlacementsOptions = options;
            (window as any).mParticle.Rokt.selectPlacementsCalled = true;
          },
        };
      });

      it('should send userAttributes if userIdentities is null but userAttributes exists', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'test-attribute': 'test-value',
          },
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          mpid: 'abc',
        });
      });

      it('should send userIdentities when userAttributes is null but userIdentities exists', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          customerid: 'customer123',
          email: 'test@example.com',
          mpid: '234',
        });
      });

      it('should send userAttributes and userIdentities if both exist', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'test-attribute': 'test-value',
          },
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          customerid: 'customer123',
          email: 'test@example.com',
          mpid: '123',
        });
      });

      it('should not send userIdentities if filteredUser is null', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
            return attributes;
          },
          filteredUser: null,
        };

        // Set up the createLauncher to properly resolve asynchronously
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'test-attribute': 'test-value',
          },
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          mpid: null,
        });
      });

      it('should not send userIdentities if getUserIdentities function does not exist', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
            return attributes;
          },
          filteredUser: {
            getMPID: function () {
              return '123';
            },
            // getUserIdentities is intentionally missing
          },
        };

        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'test-attribute': 'test-value',
          },
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          mpid: '123',
        });
      });

      it('should map other userIdentities to emailsha256', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          customerid: 'customer123',
          emailsha256: 'sha256-test@gmail.com',
          mpid: '234',
        });
      });

      it('should not set emailsha256 when the mapped source identity is null', async () => {
        // hashedEmailUserIdentityType points at `other`, but `other` is null —
        // the kit must not forward `emailsha256: null` (or any synthesized
        // null value) to the placements payload.
        (window as any).mParticle.Rokt.filters = {
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
                  other: null,
                },
              };
            },
          },
        };

        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        const attrs = (window as any).Rokt.selectPlacementsOptions.attributes;
        expect(attrs).toEqual({
          customerid: 'customer123',
          mpid: '234',
        });
        expect(attrs).not.toHaveProperty('emailsha256');
        expect(attrs).not.toHaveProperty('other');
      });

      it('should map other to emailsha256 when other is passed through selectPlacements', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'test-attribute': 'test-value',
          },
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            other: 'other-attribute',
          },
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          customerid: 'customer123',
          other: 'other-attribute',
          mpid: '123',
        });
      });

      it('should pass the attribute `other` in selectPlacements directly to Rokt', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'test-attribute': 'test-value',
          },
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            other: 'continues-to-exist',
          },
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          customerid: 'customer123',
          other: 'continues-to-exist',
          emailsha256: 'other-id',
          mpid: '123',
        });
      });

      it('should use custom hashedEmailUserIdentityType when provided in settings', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other5', // TitleCase from server
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'test-attribute': 'test-value',
          },
        });

        // Should map customerid from userIdentities to emailsha256 since hashedEmailUserIdentityType was set to 'CustomerID'
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attribute': 'test-value',
          emailsha256: 'hashed-customer-id-value', // mapped from customerid in userIdentities
          mpid: '789',
        });
      });

      it('should NOT set emailsha256 on final select placements attributes when hashedEmailUserIdentityType is Unassigned', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Unassigned', // Mixed case from server
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'test-attr': 'test-value',
          },
        });

        // Should map customidentity from userIdentities to emailsha256 (TitleCase converted to lowercase)
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          'test-attr': 'test-value',
          other: 'hashed-custom-identity-value',
          mpid: '999',
        });
      });

      it('should keep both email and emailsha256 when emailsha256 is passed through selectPlacements and email exists in userIdentities', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            emailsha256: 'hashed-email-value',
          },
        });

        // Should keep both email from userIdentities and emailsha256 from selectPlacements
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'test@example.com',
          emailsha256: 'hashed-email-value',
          mpid: '456',
        });
      });

      it('should keep both email and emailsha256 when both are passed through selectPlacements', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            email: 'developer-email@example.com',
            emailsha256: 'hashed-email-value',
          },
        });

        // Should keep both email and emailsha256 since developer explicitly passed both
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'developer-email@example.com',
          emailsha256: 'hashed-email-value',
          mpid: '789',
        });
      });

      it('should include email in kit.selectPlacements call if not passed, and email exists in userIdentities', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            someAttribute: 'someValue',
          },
        });

        // Should keep email from userIdentities since emailsha256 does not exist
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'identity-email@example.com',
          customerid: 'customer456',
          someAttribute: 'someValue',
          mpid: '901',
        });
      });

      it('should have both email and emailsha256 in kit.selectPlacements call if both exist on userIdentities, and neither is passed through selectPlacements', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        // Should keep both email and emailsha256 since emailsha256 was mapped from other identity (not explicitly passed)
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'identity-email@example.com',
          emailsha256: 'hashed-from-other',
          customerid: 'customer789',
          mpid: '912',
        });
      });

      it('should keep only email from selectPlacements when no emailsha256 exists', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            email: 'developer-email@example.com',
          },
        });

        // Should keep email from selectPlacements since no emailsha256 exists
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'developer-email@example.com',
          customerid: 'customer202',
          mpid: '934',
        });
      });

      it('should keep only emailsha256 from selectPlacements when no email exists in userIdentities', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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

        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            emailsha256: 'developer-hashed-email',
          },
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          emailsha256: 'developer-hashed-email',
          customerid: 'customer303',
          mpid: '945',
        });
      });

      it('should have nothing when neither email nor emailsha256 exist anywhere', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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

        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          customerid: 'customer505',
          mpid: '967',
        });
      });

      it('should keep only emailsha256 from userIdentities when email is not in userIdentities and developer passes nothing', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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

        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          emailsha256: 'hashed-from-useridentities',
          customerid: 'customer606',
          mpid: '978',
        });
      });

      it('should keep both when developer passes both and both exist in userIdentities', async () => {
        (window as any).mParticle.Rokt.filters = {
          userAttributeFilters: [],
          filterUserAttributes: function (attributes: any) {
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

        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            email: 'developer-email@example.com',
            emailsha256: 'developer-hashed-email',
          },
        });

        // Should use developer-passed values for both
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'developer-email@example.com',
          emailsha256: 'developer-hashed-email',
          customerid: 'customer909',
          mpid: '992',
        });
      });

      it('should NOT map other userIdentities to emailsha256 when the value is an empty string', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        // Should NOT include emailsha256 since the other identity value was empty
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'test@gmail.com',
          mpid: '234',
        });
      });

      it('should NOT map other userIdentities to emailsha256 when the value is null', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        // Should NOT include emailsha256 since the other identity value was null
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'test@gmail.com',
          mpid: '345',
        });
      });

      it('should NOT map other userIdentities to emailsha256 when the value is undefined', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        // Should NOT include emailsha256 since the other identity value was undefined
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'test@gmail.com',
          mpid: '456',
        });
      });

      it('should NOT map other userIdentities to emailsha256 when the value is 0', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        // Should NOT include emailsha256 since the other identity value was 0
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'test@gmail.com',
          mpid: '567',
        });
      });

      it('should NOT map other userIdentities to emailsha256 when the value is false', async () => {
        (window as any).mParticle.Rokt.filters = {
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
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function (options: any) {
              (window as any).mParticle.Rokt.selectPlacementsOptions = options;
              (window as any).mParticle.Rokt.selectPlacementsCalled = true;
            },
          });
        };
        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
            hashedEmailUserIdentityType: 'Other',
          },
          reportService.cb,
          true,
          null,
          {},
        );
        // Wait for attachKit to complete (fires after the full async launcher chain)
        await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {},
        });

        // Should NOT include emailsha256 since the other identity value was false
        expect((window as any).Rokt.selectPlacementsOptions.attributes).toEqual({
          email: 'test@gmail.com',
          mpid: '678',
        });
      });
    });

    describe('#logSelectPlacementsEvent', () => {
      it('should log a custom event', async () => {
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function () {
              return Promise.resolve({
                context: {
                  sessionId: Promise.resolve('rokt-session-abc'),
                },
              });
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'cached-user-attr': 'cached-value',
          },
        );

        await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'new-attr': 'new-value',
          },
        });

        await waitForCondition(() => mParticle.loggedEvents.length > 0);

        expect(mParticle.loggedEvents.length).toBe(1);
        expect(mParticle.loggedEvents[0].eventName).toBe('selectPlacements');
        expect(mParticle.loggedEvents[0].eventType).toBe(8); // EventType.Other

        const eventAttributes = mParticle.loggedEvents[0].eventAttributes;
        expect(eventAttributes).toHaveProperty('mpid');
      });

      it('should include merged user attributes, identities, and mpid', async () => {
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function () {
              return Promise.resolve({
                context: {
                  sessionId: Promise.resolve('rokt-session-abc'),
                },
              });
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'cached-user-attr': 'cached-value',
          },
        );

        await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'new-attr': 'new-value',
          },
        });

        await waitForCondition(() => mParticle.loggedEvents.length > 0);

        const eventAttributes = mParticle.loggedEvents[0].eventAttributes;

        // eventAttributes should include merged attributes and mpid directly
        expect(eventAttributes).toHaveProperty('mpid', '123');
        expect(eventAttributes).toHaveProperty('new-attr', 'new-value');
        expect(eventAttributes).toHaveProperty('cached-user-attr', 'cached-value');
      });

      it('should log event when sessionId promise rejects', async () => {
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function () {
              return Promise.resolve({
                context: {
                  sessionId: Promise.reject(new Error('session id failed')),
                },
              });
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'cached-user-attr': 'cached-value',
          },
        );

        await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'new-attr': 'new-value',
          },
        });

        await waitForCondition(() => mParticle.loggedEvents.length > 0);

        expect(mParticle.loggedEvents.length).toBe(1);
        expect(mParticle.loggedEvents[0].eventName).toBe('selectPlacements');
      });

      it('should log event when selection has no sessionId', async () => {
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function () {
              return Promise.resolve({
                context: {},
              });
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'cached-user-attr': 'cached-value',
          },
        );

        await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'new-attr': 'new-value',
          },
        });

        await waitForCondition(() => mParticle.loggedEvents.length > 0);

        expect(mParticle.loggedEvents.length).toBe(1);
        expect(mParticle.loggedEvents[0].eventName).toBe('selectPlacements');
      });

      it('should log event when selectPlacements promise rejects', async () => {
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function () {
              return Promise.reject(new Error('selection failed'));
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'cached-user-attr': 'cached-value',
          },
        );

        await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

        try {
          await (window as any).mParticle.forwarder.selectPlacements({
            identifier: 'test-placement',
            attributes: {
              'new-attr': 'new-value',
            },
          });
        } catch (_e) {
          // Expected rejection from selectPlacements
        }

        await waitForCondition(() => mParticle.loggedEvents.length > 0);

        expect(mParticle.loggedEvents.length).toBe(1);
        expect(mParticle.loggedEvents[0].eventName).toBe('selectPlacements');
      });

      it('should log event when selectPlacements returns a non-thenable value', async () => {
        (window as any).Rokt.createLauncher = async function () {
          return Promise.resolve({
            selectPlacements: function () {
              // Returns a non-thenable (no .then method)
              return undefined;
            },
          });
        };

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {
            'cached-user-attr': 'cached-value',
          },
        );

        await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            'new-attr': 'new-value',
          },
        });

        await waitForCondition(() => mParticle.loggedEvents.length > 0);

        expect(mParticle.loggedEvents.length).toBe(1);
        expect(mParticle.loggedEvents[0].eventName).toBe('selectPlacements');
      });

      it('should skip logging when mParticle.logEvent is not available', async () => {
        const originalLogEvent = (window as any).mParticle.logEvent;
        (window as any).mParticle.logEvent = undefined;

        await (window as any).mParticle.forwarder.init(
          {
            accountId: '123456',
          },
          reportService.cb,
          true,
          null,
          {},
        );

        await (window as any).mParticle.forwarder.selectPlacements({
          identifier: 'test-placement',
          attributes: {
            attr: 'value',
          },
        });

        expect((window as any).Rokt.selectPlacementsCalled).toBe(true);
        expect(mParticle.loggedEvents.length).toBe(0);
        (window as any).mParticle.logEvent = originalLogEvent;
      });
    });
  });

  describe('#use', () => {
    beforeEach(() => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
    });

    it('should call launcher.use with the provided extension name when fully initialized', async () => {
      (window as any).mParticle.forwarder.isInitialized = true;
      (window as any).mParticle.forwarder.launcher = {
        use: function (name: any) {
          (window as any).Rokt.useCalled = true;
          (window as any).Rokt.useName = name;
          return Promise.resolve({});
        },
      };

      await (window as any).mParticle.forwarder.use('ThankYouPageJourney');

      expect((window as any).Rokt.useCalled).toBe(true);
      expect((window as any).Rokt.useName).toBe('ThankYouPageJourney');
    });

    it('should reject when called before initialization', async () => {
      (window as any).mParticle.forwarder.isInitialized = false;

      try {
        await (window as any).mParticle.forwarder.use('ThankYouPageJourney');
      } catch (error: any) {
        expect(error.message).toBe('Rokt Kit: Not initialized');
      }
    });

    it('should log an error when called before initialization', async () => {
      const originalConsoleError = window.console.error;
      let errorLogged = false;
      let errorMessage = null;
      window.console.error = function (message: any) {
        errorLogged = true;
        errorMessage = message;
      };

      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.forwarder.launcher = null;

      try {
        await (window as any).mParticle.forwarder.use('ThankYouPageJourney');
        throw new Error('Expected promise to reject');
      } catch (error: any) {
        expect(error.message).toBe('Rokt Kit: Not initialized');
      } finally {
        window.console.error = originalConsoleError;
      }

      expect(errorLogged).toBe(true);
      expect(errorMessage).toBe('Rokt Kit: Not initialized');
    });

    it('should reject when extension name is invalid', async () => {
      (window as any).mParticle.forwarder.isInitialized = true;
      (window as any).mParticle.forwarder.launcher = {
        use: function () {
          return Promise.resolve({});
        },
      };

      try {
        await (window as any).mParticle.forwarder.use(123);
      } catch (error: any) {
        expect(error.message).toBe('Rokt Kit: Invalid extension name');
      }
    });

    it('should log an error when kit is initialized but launcher is missing', async () => {
      const originalConsoleError = window.console.error;
      let errorLogged = false;
      let errorMessage = null;
      window.console.error = function (message: any) {
        errorLogged = true;
        errorMessage = message;
      };

      (window as any).mParticle.forwarder.isInitialized = true;
      (window as any).mParticle.forwarder.launcher = null;

      try {
        await (window as any).mParticle.forwarder.use('ThankYouPageJourney');
        throw new Error('Expected promise to reject');
      } catch (error: any) {
        expect(error.message).toBe('Rokt Kit: Not initialized');
      } finally {
        window.console.error = originalConsoleError;
      }
      expect(errorLogged).toBe(true);
      expect(errorMessage).toBe('Rokt Kit: Not initialized');
    });

    it('should call launcher.use after init (test mode) and attach', async () => {
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };

      (window as any).Rokt.createLauncher = async function () {
        return Promise.resolve({
          use: function (name: any) {
            (window as any).Rokt.useCalled = true;
            (window as any).Rokt.useName = name;
            return Promise.resolve({});
          },
        });
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      await (window as any).mParticle.forwarder.use('ThankYouPageJourney');

      expect((window as any).Rokt.useCalled).toBe(true);
      expect((window as any).Rokt.useName).toBe('ThankYouPageJourney');
    });
  });

  describe('#setUserAttribute', () => {
    beforeEach(() => {
      (window as any).mParticle.sessionManager = {
        getSession: function () {
          return 'test-mp-session-id';
        },
      };
    });
    it('should set the user attribute', async () => {
      (window as any).mParticle.forwarder.setUserAttribute('test-attribute', 'test-value');

      expect((window as any).mParticle.forwarder.userAttributes).toEqual({
        'test-attribute': 'test-value',
      });
    });
  });

  describe('#removeUserAttribute', () => {
    it('should remove the user attribute', async () => {
      (window as any).mParticle.forwarder.setUserAttribute('test-attribute', 'test-value');

      (window as any).mParticle.forwarder.removeUserAttribute('test-attribute');

      expect((window as any).mParticle.forwarder.userAttributes).toEqual({});
    });
  });

  describe('#onUserIdentified', () => {
    it('should set the filtered user and userAttributes', () => {
      (window as any).mParticle.forwarder.onUserIdentified({
        getAllUserAttributes: function () {
          return { 'test-attribute': 'test-value' };
        },
        getMPID: function () {
          return '123';
        },
        getUserIdentities: function () {
          return { userIdentities: {} };
        },
      });

      expect((window as any).mParticle.forwarder.userAttributes).toEqual({
        'test-attribute': 'test-value',
      });
      expect((window as any).mParticle.forwarder.filters.filteredUser.getMPID()).toBe('123');
    });
  });

  describe('#workspaceIdSync', () => {
    const WORKSPACE_API_KEY = 'workspace-key-abc123';

    function makeUser(overrides: any = {}) {
      return {
        getAllUserAttributes: () => ({}),
        getMPID: () => '123',
        getUserIdentities: () => ({ userIdentities: { email: 'test@example.com' } }),
        ...overrides,
      };
    }

    let originalIdentity: any;

    beforeEach(() => {
      originalIdentity = (window as any).mParticle.Identity;
    });

    afterEach(() => {
      (window as any).mParticle.Identity = originalIdentity;
      (window as any).mParticle.forwarder.userAttributes = {};
      // The kit's `init()` only runs once per instance in production, so it
      // does NOT reset workspace-search state. In tests, multiple cases
      // share a single forwarder instance and call init repeatedly, so we
      // have to clear search state here to keep tests independent —
      // otherwise the identities-cache hit would suppress a search the
      // next test expects.
      (window as any).mParticle.forwarder.userIdentifiedInWorkspace = false;
      (window as any).mParticle.forwarder._workspaceSearchInFlightPromise = null;
      (window as any).mParticle.forwarder._workspaceLastSearchedIdentitiesKey = undefined;
    });

    it('should call Identity.search with the configured api key and set userIdentifiedInWorkspace when 200 returned', async () => {
      let receivedApiKey: any = null;
      let receivedKnownIdentities: any = null;
      (window as any).mParticle.Identity = {
        search: (apiKey: any, knownIdentities: any, cb: any) => {
          receivedApiKey = apiKey;
          receivedKnownIdentities = knownIdentities;
          cb({ httpCode: 200, body: { mpid: '999' } });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      expect(receivedApiKey).toBe(WORKSPACE_API_KEY);
      expect(receivedKnownIdentities).toEqual({ email: 'test@example.com' });
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(true);
    });

    it('should search cached filtered user identities when the launcher initializes', async () => {
      let receivedApiKey: any = null;
      let receivedKnownIdentities: any = null;
      let searchCallCount = 0;
      (window as any).mParticle.Identity = {
        search: (apiKey: any, knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          receivedApiKey = apiKey;
          receivedKnownIdentities = knownIdentities;
          cb({ httpCode: 200, body: { mpid: '999' } });
        },
      };
      (window as any).mParticle.Rokt.attachKit = async () => {};
      (window as any).mParticle.Rokt.filters = {
        userAttributeFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: makeUser(),
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => searchCallCount === 1);

      expect(receivedApiKey).toBe(WORKSPACE_API_KEY);
      expect(receivedKnownIdentities).toEqual({ email: 'test@example.com' });
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(true);
    });

    it('should not search cached filtered user identities when workspaceIdSyncApiKey is missing', async () => {
      let searchCalled = false;
      (window as any).mParticle.Identity = {
        search: () => {
          searchCalled = true;
        },
      };
      (window as any).mParticle.Rokt.attachKit = async () => {};
      (window as any).mParticle.Rokt.filters = {
        userAttributeFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: makeUser(),
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});
      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      expect(searchCalled).toBe(false);
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should not search cached filtered user when it has no usable identifiers', async () => {
      let searchCalled = false;
      (window as any).mParticle.Identity = {
        search: () => {
          searchCalled = true;
        },
      };
      (window as any).mParticle.Rokt.attachKit = async () => {};
      (window as any).mParticle.Rokt.filters = {
        userAttributeFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: makeUser({ getUserIdentities: () => ({ userIdentities: {} }) }),
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );
      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      expect(searchCalled).toBe(false);
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should not set userIdentifiedInWorkspace when search returns 404', async () => {
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          cb({ httpCode: 404 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should not call search when workspaceIdSyncApiKey is missing', async () => {
      let searchCalled = false;
      (window as any).mParticle.Identity = {
        search: () => {
          searchCalled = true;
        },
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      expect(searchCalled).toBe(false);
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should not call search when workspaceIdSyncApiKey is an empty string', async () => {
      let searchCalled = false;
      (window as any).mParticle.Identity = {
        search: () => {
          searchCalled = true;
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: '' },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      expect(searchCalled).toBe(false);
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should not call search when the user has no usable identifiers', async () => {
      let searchCalled = false;
      (window as any).mParticle.Identity = {
        search: () => {
          searchCalled = true;
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({ getUserIdentities: () => ({ userIdentities: {} }) }),
      );

      expect(searchCalled).toBe(false);
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should call search and forward non-email identifiers (e.g. hashed email in `other`)', async () => {
      let receivedKnownIdentities: any = null;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, knownIdentities: any, cb: any) => {
          receivedKnownIdentities = knownIdentities;
          cb({ httpCode: 200, body: { mpid: '999' } });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({
          getUserIdentities: () => ({
            userIdentities: { other: 'sha256:abc123', customerid: 'cust-1' },
          }),
        }),
      );

      expect(receivedKnownIdentities).toEqual({ other: 'sha256:abc123', customerid: 'cust-1' });
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(true);
    });

    it('should forward all non-empty string identifiers and drop empty/null entries', async () => {
      let receivedKnownIdentities: any = null;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, knownIdentities: any, cb: any) => {
          receivedKnownIdentities = knownIdentities;
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({
          getUserIdentities: () => ({
            userIdentities: {
              email: 'user@example.com',
              other: 'sha256:abc',
              customerid: '',
              mobile_number: null,
              facebook: 'fb-id',
            },
          }),
        }),
      );

      expect(receivedKnownIdentities).toEqual({
        email: 'user@example.com',
        other: 'sha256:abc',
        facebook: 'fb-id',
      });
    });

    it('should not throw when Identity.search is unavailable', async () => {
      (window as any).mParticle.Identity = {};

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      expect(() => {
        (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      }).not.toThrow();
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should swallow errors thrown by search', async () => {
      (window as any).mParticle.Identity = {
        search: () => {
          throw new Error('boom');
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      expect(() => {
        (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      }).not.toThrow();
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should wait for an in-flight search before selectPlacements builds attributes', async () => {
      // Race regression: previously, onUserIdentified fired search
      // synchronously and returned. Partners doing
      // `Identity.login(...).then(() => Rokt.selectPlacements(...))` would
      // read the flag before the HTTP response landed, missing the flag for
      // the most important placement call. Now selectPlacements awaits the
      // in-flight search (with a timeout) before building attributes.
      let triggerSearchResponse: () => void = () => undefined;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          // Defer the callback to simulate a real network round-trip.
          triggerSearchResponse = () => cb({ httpCode: 200, body: { mpid: '999' } });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      // Stub launcher + filters so selectPlacements can dispatch.
      let launcherCalledWithAttributes: any = null;
      (window as any).mParticle.forwarder.launcher = {
        selectPlacements: (opts: any) => {
          launcherCalledWithAttributes = opts.attributes;
          return { context: { sessionId: Promise.resolve('test-session') } };
        },
      };
      (window as any).mParticle.forwarder.filters = {
        userAttributesFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: { getMPID: () => '123' },
      };

      // Identification kicks off the search; callback NOT yet fired.
      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      // selectPlacements is invoked while the search is still in flight.
      const placementPromise = (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {},
      });

      // Resolve the search; selectPlacements should now proceed and merge the flag.
      triggerSearchResponse();
      await placementPromise;

      expect(launcherCalledWithAttributes.userIdentifiedInWorkspace).toBe(true);
    });

    it('should preserve an in-flight cached-user search when the same identity re-identifies', async () => {
      let triggerSearchResponse: () => void = () => undefined;
      let searchCallCount = 0;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          triggerSearchResponse = () => cb({ httpCode: 200, body: { mpid: '999' } });
        },
      };
      (window as any).mParticle.Rokt.attachKit = async () => {};
      (window as any).mParticle.Rokt.filters = {
        userAttributeFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: makeUser(),
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );
      await waitForCondition(() => searchCallCount === 1);

      // A same-identity onUserIdentified while the cached-user search is
      // still in flight should dedupe the network call without replacing the
      // promise selectPlacements needs to wait on.
      (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      expect(searchCallCount).toBe(1);

      let launcherCalledWithAttributes: any = null;
      (window as any).mParticle.forwarder.launcher = {
        selectPlacements: (opts: any) => {
          launcherCalledWithAttributes = opts.attributes;
          return { context: { sessionId: Promise.resolve('test-session') } };
        },
      };

      const placementPromise = (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {},
      });

      triggerSearchResponse();
      await placementPromise;

      expect(launcherCalledWithAttributes.userIdentifiedInWorkspace).toBe(true);
    });

    it('should reset userIdentifiedInWorkspace on onLogoutComplete', async () => {
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(true);

      // onLogoutComplete must clear the flag so anonymous sessions don't
      // carry the previous user's match forward — search is only
      // fired from onUserIdentified, so logout has no re-evaluation path.
      (window as any).mParticle.forwarder.onLogoutComplete({
        getAllUserAttributes: () => ({}),
        getMPID: () => '999',
      });

      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should reset userIdentifiedInWorkspace when re-identifying via a short-circuit path', async () => {
      // A previous identification matched (flag=true). The new user has no
      // email, so search short-circuits without dispatching. The
      // flag must reset to false rather than leak from the previous user.
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(true);

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({ getUserIdentities: () => ({ userIdentities: {} }) }),
      );

      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(false);
    });

    it('should not re-call Identity.search when the same identifier set re-identifies', async () => {
      let searchCallCount = 0;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      // Two identifications with the same identifier set. Should dispatch
      // only once; the cached identities key skips the second network call.
      (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      expect(searchCallCount).toBe(1);
      // Flag from the first match still correct after the second identify.
      expect((window as any).mParticle.forwarder.userIdentifiedInWorkspace).toBe(true);
    });

    it('should not re-call Identity.search when the same identifier set arrives with different key insertion order', async () => {
      let searchCallCount = 0;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({
          getUserIdentities: () => ({
            userIdentities: { email: 'a@example.com', other: 'sha256:abc' },
          }),
        }),
      );
      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({
          getUserIdentities: () => ({
            userIdentities: { other: 'sha256:abc', email: 'a@example.com' },
          }),
        }),
      );

      expect(searchCallCount).toBe(1);
    });

    it('should re-call Identity.search when a non-email identifier changes', async () => {
      let searchCallCount = 0;
      const observedHashes: string[] = [];
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          observedHashes.push(knownIdentities.other);
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({ getUserIdentities: () => ({ userIdentities: { other: 'sha256:aaa' } }) }),
      );
      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({ getUserIdentities: () => ({ userIdentities: { other: 'sha256:bbb' } }) }),
      );

      expect(searchCallCount).toBe(2);
      expect(observedHashes).toEqual(['sha256:aaa', 'sha256:bbb']);
    });

    it('should re-call Identity.search when the email changes', async () => {
      let searchCallCount = 0;
      const observedEmails: string[] = [];
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          observedEmails.push(knownIdentities.email);
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({ getUserIdentities: () => ({ userIdentities: { email: 'a@example.com' } }) }),
      );
      (window as any).mParticle.forwarder.onUserIdentified(
        makeUser({ getUserIdentities: () => ({ userIdentities: { email: 'b@example.com' } }) }),
      );

      expect(searchCallCount).toBe(2);
      expect(observedEmails).toEqual(['a@example.com', 'b@example.com']);
    });

    it('should re-call Identity.search after logout even with the same identifiers', async () => {
      let searchCallCount = 0;
      (window as any).mParticle.Identity = {
        search: (_apiKey: any, _knownIdentities: any, cb: any) => {
          searchCallCount += 1;
          cb({ httpCode: 200 });
        },
      };

      await (window as any).mParticle.forwarder.init(
        { accountId: '123456', workspaceIdSyncApiKey: WORKSPACE_API_KEY },
        reportService.cb,
        true,
        null,
        {},
      );

      (window as any).mParticle.forwarder.onUserIdentified(makeUser());
      // Logout clears the identities cache so a re-login re-evaluates.
      (window as any).mParticle.forwarder.onLogoutComplete({
        getAllUserAttributes: () => ({}),
        getMPID: () => '999',
      });
      (window as any).mParticle.forwarder.onUserIdentified(makeUser());

      expect(searchCallCount).toBe(2);
    });
  });

  describe('#onLoginComplete', () => {
    it('should update userAttributes from the filtered user', () => {
      (window as any).mParticle.forwarder.onLoginComplete({
        getAllUserAttributes: function () {
          return { 'user-attr': 'user-value' };
        },
        getMPID: function () {
          return '123';
        },
      });

      expect((window as any).mParticle.forwarder.userAttributes).toEqual({
        'user-attr': 'user-value',
      });
    });
  });

  describe('#onLogoutComplete', () => {
    it('should update userAttributes from the filtered user', () => {
      (window as any).mParticle.forwarder.onLogoutComplete({
        getAllUserAttributes: function () {
          return { 'remaining-attr': 'some-value' };
        },
        getMPID: function () {
          return '123';
        },
      });

      expect((window as any).mParticle.forwarder.userAttributes).toEqual({
        'remaining-attr': 'some-value',
      });
    });
  });

  describe('#onModifyComplete', () => {
    it('should update userAttributes from the filtered user', () => {
      (window as any).mParticle.forwarder.onModifyComplete({
        getAllUserAttributes: function () {
          return { 'modified-attr': 'modified-value' };
        },
        getMPID: function () {
          return '123';
        },
        getUserIdentities: function () {
          return { userIdentities: {} };
        },
      });

      expect((window as any).mParticle.forwarder.userAttributes).toEqual({
        'modified-attr': 'modified-value',
      });
    });
  });

  describe('#fetchOptimizely', () => {
    // Helper functions for setting up Optimizely mocks
    function setupValidOptimizelyMock(experiments: any) {
      (window as any).optimizely = {
        get: function (key: any) {
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

    function setupInvalidOptimizelyMock(stateObject: any) {
      (window as any).optimizely = {
        get: function (key: any) {
          if (key === 'state') {
            return stateObject;
          }
        },
      };
    }

    // Common test setup
    async function initAndSelectPlacements(settings: any = {}) {
      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          ...settings,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {
          test: 'test',
        },
      });
    }

    beforeEach(() => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.setLocalSessionAttribute = function (key: any, value: any) {
        mParticle._Store.localSessionAttributes[key] = value;
      };
      (window as any).mParticle.Rokt.getLocalSessionAttributes = function () {
        return mParticle._Store.localSessionAttributes;
      };
      (window as any).mParticle.forwarder.launcher = {
        selectPlacements: function (options: any) {
          (window as any).mParticle.Rokt.selectPlacementsOptions = options;
          (window as any).mParticle.Rokt.selectPlacementsCalled = true;
        },
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
          return attributes;
        },
        filteredUser: {
          getMPID: function () {
            return '123';
          },
        },
      };
      (window as any).mParticle._getActiveForwarders = function () {
        return [{ name: 'Optimizely' }];
      };
    });

    afterEach(() => {
      delete (window as any).optimizely;
    });

    describe('when Optimizely is properly configured', () => {
      it('should fetch experiment data for single experiment', async () => {
        setupValidOptimizelyMock({
          exp1: { id: 'var1' },
        });

        await initAndSelectPlacements({
          onboardingExpProvider: 'Optimizely',
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).toHaveProperty(
          'rokt.custom.optimizely.experiment.exp1.variationId',
          'var1',
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

        const attributes = (window as any).Rokt.selectPlacementsOptions.attributes;
        expect(attributes).toHaveProperty('rokt.custom.optimizely.experiment.exp1.variationId', 'var1');
        expect(attributes).toHaveProperty('rokt.custom.optimizely.experiment.exp2.variationId', 'var2');
      });
    });

    describe('when Optimizely is not properly configured', () => {
      it('should return empty object when Optimizely is not available', async () => {
        delete (window as any).optimizely;

        await initAndSelectPlacements({
          onboardingExpProvider: 'Optimizely',
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).not.toHaveProperty('rokt.custom.optimizely');
      });

      it('should return empty object when Optimizely state is undefined', async () => {
        setupInvalidOptimizelyMock(undefined);

        await initAndSelectPlacements({
          onboardingExpProvider: 'Optimizely',
        });

        expect((window as any).Rokt.selectPlacementsOptions.attributes).not.toHaveProperty('rokt.custom.optimizely');
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

        expect((window as any).Rokt.selectPlacementsOptions.attributes).not.toHaveProperty('rokt.custom.optimizely');
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

        expect((window as any).Rokt.selectPlacementsOptions.attributes).not.toHaveProperty('rokt.custom.optimizely');
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

        expect((window as any).Rokt.selectPlacementsOptions.attributes).not.toHaveProperty('rokt.custom.optimizely');
      });
    });
  });

  describe('#generateLauncherScript', () => {
    const baseUrl = 'https://apps.rokt-api.com/wsdk/integrations/launcher.js';

    beforeEach(() => {
      (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
      );
    });

    it('should return base URL when no domain is passed', () => {
      const url = (window as any).mParticle.forwarder.testHelpers.generateLauncherScript();
      expect(url).toBe(baseUrl);
    });

    it('should return an updated base URL with CNAME when domain is passed', () => {
      expect((window as any).mParticle.forwarder.testHelpers.generateLauncherScript('cname.rokt.com')).toBe(
        'https://cname.rokt.com/wsdk/integrations/launcher.js',
      );
    });

    it('should return base URL when no extensions are provided', () => {
      const url = (window as any).mParticle.forwarder.testHelpers.generateLauncherScript();
      expect(url).toBe(baseUrl);
    });

    it('should return base URL when extensions is null or undefined', () => {
      expect((window as any).mParticle.forwarder.testHelpers.generateLauncherScript(undefined, null)).toBe(baseUrl);

      expect((window as any).mParticle.forwarder.testHelpers.generateLauncherScript(undefined, undefined)).toBe(
        baseUrl,
      );
    });

    it('should correctly append a single extension', () => {
      const url = (window as any).mParticle.forwarder.testHelpers.generateLauncherScript(undefined, [
        'cos-extension-detection',
      ]);
      expect(url).toBe(baseUrl + '?extensions=cos-extension-detection');
    });

    it('should correctly append multiple extensions', () => {
      const url = (window as any).mParticle.forwarder.testHelpers.generateLauncherScript(undefined, [
        'cos-extension-detection',
        'experiment-monitoring',
        'sponsored-payments-apple-pay',
      ]);
      expect(url).toBe(
        baseUrl + '?extensions=cos-extension-detection,' + 'experiment-monitoring,' + 'sponsored-payments-apple-pay',
      );
    });
  });

  describe('#generateThankYouElementScript', () => {
    const baseUrl = 'https://apps.rokt-api.com/rokt-elements/rokt-element-thank-you.js';

    beforeEach(() => {
      (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true);
    });

    it('should return base URL when no domain is passed', () => {
      const url = (window as any).mParticle.forwarder.testHelpers.generateThankYouElementScript(undefined);
      expect(url).toBe(baseUrl);
    });

    it('should return an updated base URL with CNAME when domain is passed', () => {
      const url = (window as any).mParticle.forwarder.testHelpers.generateThankYouElementScript('cname.rokt.com');
      expect(url).toBe('https://cname.rokt.com/rokt-elements/rokt-element-thank-you.js');
    });
  });

  describe('#roktExtensions', () => {
    beforeEach(() => {
      (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true);
    });

    describe('extractRoktExtensionConfig', () => {
      it('should correctly map known extension names to their query parameters', () => {
        const settingsString =
          '[{&quot;jsmap&quot;:null,&quot;map&quot;:null,&quot;maptype&quot;:&quot;StaticList&quot;,&quot;value&quot;:&quot;cos-extension-detection&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:null,&quot;maptype&quot;:&quot;StaticList&quot;,&quot;value&quot;:&quot;experiment-monitoring&quot;}]';

        const result = (window as any).mParticle.forwarder.testHelpers.extractRoktExtensionConfig(settingsString);
        expect(result.roktExtensionsQueryParams).toEqual(['cos-extension-detection', 'experiment-monitoring']);
        expect(result.legacyRoktExtensions).toEqual([]);
        expect(result.loadThankYouElement).toBe(false);
      });

      it('should separate thank-you-journey into legacyRoktExtensions and set loadThankYouElement', () => {
        const settingsString =
          '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"},{"jsmap":null,"map":null,"maptype":"StaticList","value":"instant-purchase"}]';

        const result = (window as any).mParticle.forwarder.testHelpers.extractRoktExtensionConfig(settingsString);
        expect(result.roktExtensionsQueryParams).toEqual(['instant-purchase']);
        expect(result.legacyRoktExtensions).toEqual(['ThankYouPageJourney']);
        expect(result.loadThankYouElement).toBe(true);
      });
    });

    it('should fetch thank you element resource when thank you element extension is provided', async () => {
      document.getElementById('rokt-thank-you-element')?.remove();
      document.getElementById('rokt-launcher')?.remove();

      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt = {
        attachKit: async (kit: any) => {
          (window as any).mParticle.Rokt.kit = kit;
        },
        filters: {
          userAttributesFilters: [],
          filterUserAttributes: (attrs: any) => attrs,
          filteredUser: { getMPID: () => '123' },
        },
        use: () => Promise.resolve(),
        flushOnShoppableAdsReadyMessageQueue: () => {},
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      const tyeScript = document.getElementById('rokt-thank-you-element') as HTMLScriptElement;
      expect(tyeScript).not.toBeNull();
      expect(tyeScript.src).toContain('/rokt-elements/rokt-element-thank-you.js');
    });

    it('should call launcher.use with ThankYouPageJourney when thank-you-journey extension is provided', async () => {
      document.getElementById('rokt-thank-you-element')?.remove();
      document.getElementById('rokt-launcher')?.remove();

      const useCalls: string[] = [];
      const mockLauncher = {
        selectPlacements: () => {},
        hashAttributes: () => {},
        use: (name: string) => {
          useCalls.push(name);
        },
      };

      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt = {
        attachKit: async (kit: any) => {
          (window as any).mParticle.Rokt.kit = kit;
        },
        filters: {
          userAttributesFilters: [],
          filterUserAttributes: (attrs: any) => attrs,
          filteredUser: { getMPID: () => '123' },
        },
        flushOnShoppableAdsReadyMessageQueue: () => {},
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      // Use a synchronous thenable so this.launcher is set before registerLegacyExtensions runs
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).Rokt.createLauncher = () => ({
        then: (onFulfilled: (launcher: typeof mockLauncher) => void) => {
          onFulfilled(mockLauncher);
          return { catch: () => {} };
        },
      });

      const launcherScript = document.getElementById('rokt-launcher') as HTMLScriptElement;
      launcherScript.onload!(new Event('load'));

      expect(useCalls).toContain('ThankYouPageJourney');
    });

    it('should fetch thank you element resource when thank you element extension is provided', async () => {
      document.getElementById('rokt-thank-you-element')?.remove();
      document.getElementById('rokt-launcher')?.remove();

      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt = {
        attachKit: async (kit: any) => {
          (window as any).mParticle.Rokt.kit = kit;
        },
        filters: {
          userAttributesFilters: [],
          filterUserAttributes: (attrs: any) => attrs,
          filteredUser: { getMPID: () => '123' },
        },
        use: () => Promise.resolve(),
        flushOnShoppableAdsReadyMessageQueue: () => {},
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      const tyeScript = document.getElementById('rokt-thank-you-element') as HTMLScriptElement;
      expect(tyeScript).not.toBeNull();
      expect(tyeScript.src).toContain('/rokt-elements/rokt-element-thank-you.js');
    });

    it('should call launcher.use with ThankYouPageJourney when thank-you-journey extension is provided', async () => {
      document.getElementById('rokt-thank-you-element')?.remove();
      document.getElementById('rokt-launcher')?.remove();

      const useCalls: string[] = [];

      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt = {
        attachKit: async (kit: any) => {
          (window as any).mParticle.Rokt.kit = kit;
        },
        filters: {
          userAttributesFilters: [],
          filterUserAttributes: (attrs: any) => attrs,
          filteredUser: { getMPID: () => '123' },
        },
        flushOnShoppableAdsReadyMessageQueue: () => {},
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      const mockLauncher = {
        selectPlacements: () => {},
        hashAttributes: () => {},
        use: (name: string) => {
          useCalls.push(name);
        },
      };

      // Use a synchronous thenable so this.launcher is set before registerLegacyExtensions runs
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).Rokt.createLauncher = () => ({
        then: (onFulfilled: (launcher: typeof mockLauncher) => void) => {
          onFulfilled(mockLauncher);
          return { catch: () => {} };
        },
      });

      const launcherScript = document.getElementById('rokt-launcher') as HTMLScriptElement;
      launcherScript.onload!(new Event('load'));

      expect(useCalls).toContain('ThankYouPageJourney');
    });

    it('should handle invalid setting strings', () => {
      expect((window as any).mParticle.forwarder.testHelpers.extractRoktExtensionConfig('NONE')).toEqual({
        roktExtensionsQueryParams: [],
        legacyRoktExtensions: [],
        loadThankYouElement: false,
      });
      expect((window as any).mParticle.forwarder.testHelpers.extractRoktExtensionConfig(undefined)).toEqual({
        roktExtensionsQueryParams: [],
        legacyRoktExtensions: [],
        loadThankYouElement: false,
      });
      expect((window as any).mParticle.forwarder.testHelpers.extractRoktExtensionConfig(null)).toEqual({
        roktExtensionsQueryParams: [],
        legacyRoktExtensions: [],
        loadThankYouElement: false,
      });
    });
  });

  describe('#onShoppableAdsReady', () => {
    let flushOnShoppableAdsReadyMessageQueueCalled: boolean;
    let flushedKit: any;

    beforeEach(() => {
      document.getElementById('rokt-thank-you-element')?.remove();
      document.getElementById('rokt-launcher')?.remove();

      // Reset TYE load state so tests are independent of execution order.
      (window as any).mParticle.forwarder._isThankYouElementLoaded = false;
      (window as any).mParticle.forwarder._thankYouElementOnLoadCallback = null;

      flushOnShoppableAdsReadyMessageQueueCalled = false;
      flushedKit = null;

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.kit = kit;
      };
      (window as any).mParticle.Rokt.flushOnShoppableAdsReadyMessageQueue = (kit: any) => {
        flushOnShoppableAdsReadyMessageQueueCalled = true;
        flushedKit = kit;
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: (attrs: any) => attrs,
        filteredUser: { getMPID: () => '123' },
      };
    });

    it('should call flushOnShoppableAdsReadyMessageQueue with the kit when thank-you-journey extension is configured', async () => {
      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt.flushOnShoppableAdsReadyMessageQueue = (kit: any) => {
        flushOnShoppableAdsReadyMessageQueueCalled = true;
        flushedKit = kit;
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      expect(flushOnShoppableAdsReadyMessageQueueCalled).toBe(true);
      expect(flushedKit).toBe((window as any).mParticle.forwarder);
    });

    it('should NOT call flushOnShoppableAdsReadyMessageQueue when thank-you-journey is not configured', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true);

      expect(flushOnShoppableAdsReadyMessageQueueCalled).toBe(false);
    });

    it('should store the onShoppableAdsReady callback and invoke it when the TYE script loads', async () => {
      (window as any).Rokt = undefined;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      let callbackInvoked = false;
      (window as any).mParticle.forwarder.onShoppableAdsReady(() => {
        callbackInvoked = true;
      });

      // Simulate TYE script onload firing
      const tyeScript = document.getElementById('rokt-thank-you-element') as HTMLScriptElement;
      expect(tyeScript).not.toBeNull();
      tyeScript.onload!(new Event('load'));

      expect(callbackInvoked).toBe(true);
    });

    it('should overwrite a previously registered onShoppableAdsReady callback', async () => {
      (window as any).Rokt = undefined;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      let firstCallbackInvoked = false;
      let secondCallbackInvoked = false;

      (window as any).mParticle.forwarder.onShoppableAdsReady(() => {
        firstCallbackInvoked = true;
      });
      (window as any).mParticle.forwarder.onShoppableAdsReady(() => {
        secondCallbackInvoked = true;
      });

      const tyeScript = document.getElementById('rokt-thank-you-element') as HTMLScriptElement;
      tyeScript.onload!(new Event('load'));

      expect(firstCallbackInvoked).toBe(false);
      expect(secondCallbackInvoked).toBe(true);
    });

    it('should invoke the callback immediately when registered after the TYE script has already loaded', async () => {
      (window as any).Rokt = undefined;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      // Simulate TYE script loading before the callback is registered
      const tyeScript = document.getElementById('rokt-thank-you-element') as HTMLScriptElement;
      expect(tyeScript).not.toBeNull();
      tyeScript.onload!(new Event('load'));

      // Register the callback late — after the TYE script has already loaded
      let callbackInvoked = false;
      (window as any).mParticle.forwarder.onShoppableAdsReady(() => {
        callbackInvoked = true;
      });

      expect(callbackInvoked).toBe(true);
    });

    it('should not invoke the callback if the TYE script fails to load', async () => {
      (window as any).Rokt = undefined;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      let callbackInvoked = false;
      (window as any).mParticle.forwarder.onShoppableAdsReady(() => {
        callbackInvoked = true;
      });

      const tyeScript = document.getElementById('rokt-thank-you-element') as HTMLScriptElement;
      tyeScript.onerror!(new Event('error'));

      expect(callbackInvoked).toBe(false);
    });
  });

  describe('#registerLegacyExtensions', () => {
    beforeEach(() => {
      document.getElementById('rokt-thank-you-element')?.remove();
      document.getElementById('rokt-launcher')?.remove();

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.kit = kit;
      };
      (window as any).mParticle.Rokt.flushOnShoppableAdsReadyMessageQueue = () => {};
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: (attrs: any) => attrs,
        filteredUser: { getMPID: () => '123' },
      };
    });

    it('should await all launcher.use() promises before calling initRoktLauncher', async () => {
      const useCallOrder: string[] = [];
      let initCalledAfterUse = false;

      const mockLauncher = {
        selectPlacements: () => {},
        hashAttributes: () => {},
        onShoppableAdsReady: () => {},
        use: (name: string) => {
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              useCallOrder.push(name);
              resolve();
            }, 0);
          });
        },
      };

      (window as any).Rokt = undefined;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        initCalledAfterUse = useCallOrder.includes('ThankYouPageJourney');
        (window as any).mParticle.Rokt.kit = kit;
      };

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).Rokt.createLauncher = () => Promise.resolve(mockLauncher);

      const launcherScript = document.getElementById('rokt-launcher') as HTMLScriptElement;
      launcherScript.onload!(new Event('load'));

      await waitForCondition(() => initCalledAfterUse);

      expect(useCallOrder).toContain('ThankYouPageJourney');
      expect(initCalledAfterUse).toBe(true);
    });

    it('should not throw if launcher.use() rejects', async () => {
      const mockLauncher = {
        selectPlacements: () => {},
        hashAttributes: () => {},
        onShoppableAdsReady: () => {},
        use: () => Promise.reject(new Error('extension load failed')),
      };

      (window as any).Rokt = undefined;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          roktExtensions: '[{"jsmap":null,"map":null,"maptype":"StaticList","value":"thank-you-journey"}]',
        },
        reportService.cb,
        false,
      );

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).Rokt.createLauncher = () => Promise.resolve(mockLauncher);

      const launcherScript = document.getElementById('rokt-launcher') as HTMLScriptElement;

      // Should not throw
      await expect(
        new Promise<void>((resolve) => {
          launcherScript.onload!(new Event('load'));
          setTimeout(resolve, 50);
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('#generateMappedEventLookup', () => {
    beforeEach(async () => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
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

      expect((window as any).mParticle.forwarder.testHelpers.generateMappedEventLookup(placementEventMapping)).toEqual({
        '-1484452948': 'foo-mapped-flag',
        1838502119: 'ad_viewed_test',
      });
    });

    it('should return an empty object if the placement event mapping is null', () => {
      expect((window as any).mParticle.forwarder.testHelpers.generateMappedEventLookup(null)).toEqual({});
    });
  });

  describe('#generateMappedEventAttributeLookup', () => {
    beforeEach(async () => {
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
        },
        reportService.cb,
        true,
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

      expect(
        (window as any).mParticle.forwarder.testHelpers.generateMappedEventAttributeLookup(
          placementEventAttributeMapping,
        ),
      ).toEqual({
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

      expect(
        (window as any).mParticle.forwarder.testHelpers.generateMappedEventAttributeLookup(
          placementEventAttributeMapping,
        ),
      ).toEqual({
        hasUrl: [
          {
            eventAttributeKey: 'URL',
            conditions: [],
          },
        ],
      });
    });

    it('should return an empty object when placementEventAttributeMapping is null', () => {
      expect((window as any).mParticle.forwarder.testHelpers.generateMappedEventAttributeLookup(null)).toEqual({});
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

      expect(
        (window as any).mParticle.forwarder.testHelpers.generateMappedEventAttributeLookup(
          placementEventAttributeMapping,
        ),
      ).toEqual({
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
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).Rokt.createLauncher = async function () {
        return Promise.resolve({
          selectPlacements: function (options: any) {
            (window as any).mParticle.Rokt.selectPlacementsOptions = options;
            (window as any).mParticle.Rokt.selectPlacementsCalled = true;
          },
        });
      };
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.setLocalSessionAttribute = function (key: any, value: any) {
        (window as any).mParticle._Store.localSessionAttributes[key] = value;
      };
      (window as any).mParticle.Rokt.getLocalSessionAttributes = function () {
        return (window as any).mParticle._Store.localSessionAttributes;
      };
      (window as any).mParticle.forwarder.launcher = {
        selectPlacements: function (options: any) {
          (window as any).mParticle.Rokt.selectPlacementsOptions = options;
          (window as any).mParticle.Rokt.selectPlacementsCalled = true;
        },
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
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
      (window as any).mParticle.forwarder.eventQueue = [];
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.Rokt.attachKitCalled = false;
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle.forwarder.process({
        EventName: 'Video Watched',
        EventCategory: EventType.Other,
        EventDataType: MessageType.PageEvent,
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/home',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/sale/items',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/anything',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          someOtherAttribute: 'value',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/anything',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
        hasUrl: true,
      });

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          someOtherAttribute: 'value',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          number_of_products: 2,
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
        multipleproducts: true,
      });

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          number_of_products: '2',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          number_of_products: 2,
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Test',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          boolAttr: true,
          zeroAttr: 0,
          numAttr: 123,
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Test',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          otherAttr: 'value',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Test',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/sale',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/sale/items',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/sale',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
        saleSeeker: true,
      });

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/sale/items',
        },
      });
      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Test',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          zeroProp: 0,
          falseProp: false,
          emptyStringProp: '',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({});
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

      await (window as any).mParticle.forwarder.init(
        {
          accountId: '123456',
          placementEventMapping,
          placementEventAttributeMapping,
        },
        reportService.cb,
        true,
        null,
        {},
      );

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Browse',
        EventCategory: EventType.Unknown,
        EventDataType: MessageType.PageView,
        EventAttributes: {
          URL: 'https://example.com/anything',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
        hasUrl: true,
      });

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Video Watched',
        EventCategory: EventType.Other,
        EventDataType: MessageType.PageEvent,
        EventAttributes: {
          URL: 'https://example.com/video',
        },
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
        hasUrl: true,
        'foo-mapped-flag': true,
      });

      (window as any).mParticle._Store.localSessionAttributes = {};
      (window as any).mParticle.forwarder.process({
        EventName: 'Video Watched',
        EventCategory: EventType.Other,
        EventDataType: MessageType.PageEvent,
      });

      expect((window as any).mParticle._Store.localSessionAttributes).toEqual({
        'foo-mapped-flag': true,
      });
    });
  });

  describe('#processBatch', () => {
    let mockBatch: Batch;

    beforeEach(() => {
      (window as any).mParticle.forwarder.batchQueue = [];
      (window as any).mParticle.forwarder.batchStreamQueue = [];
      (window as any).mParticle.forwarder.pendingIdentityEvents = [];
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).Rokt.createLauncher = async function () {
        return Promise.resolve({
          selectPlacements: function (options: any) {
            (window as any).mParticle.Rokt.selectPlacementsOptions = options;
            (window as any).mParticle.Rokt.selectPlacementsCalled = true;
          },
        });
      };
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.setLocalSessionAttribute = function (key: any, value: any) {
        (window as any).mParticle._Store.localSessionAttributes[key] = value;
      };
      (window as any).mParticle.Rokt.getLocalSessionAttributes = function () {
        return (window as any).mParticle._Store.localSessionAttributes;
      };
      (window as any).mParticle.forwarder.launcher = {
        selectPlacements: function (options: any) {
          (window as any).mParticle.Rokt.selectPlacementsOptions = options;
          (window as any).mParticle.Rokt.selectPlacementsCalled = true;
        },
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
          return attributes;
        },
        filteredUser: {
          getMPID: function () {
            return '123';
          },
        },
      };

      mockBatch = {
        mpid: 'test-mpid-123',
        user_attributes: { 'user-attr': 'user-value' },
        user_identities: { email: 'test@example.com' },
        events: [
          {
            event_type: 'custom_event',
            data: { event_name: 'Test Event', custom_event_type: 'other' },
          },
        ],
      };
    });

    afterEach(() => {
      delete (window as any).Rokt.__batch_stream__;
      (window as any).mParticle.forwarder.batchQueue = [];
      (window as any).mParticle.forwarder.batchStreamQueue = [];
      (window as any).mParticle.forwarder.pendingIdentityEvents = [];
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.Rokt.attachKitCalled = false;
    });

    it('should send batch to window.Rokt.__batch_stream__ when kit is ready', async () => {
      const receivedBatches: any[] = [];
      (window as any).Rokt.__batch_stream__ = function (payload: any) {
        receivedBatches.push(payload);
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      (window as any).mParticle.forwarder.processBatch(mockBatch);

      expect(receivedBatches.length).toBe(1);
      expect(receivedBatches[0].mpid).toBe('test-mpid-123');
      expect(receivedBatches[0].user_attributes).toEqual({ 'user-attr': 'user-value' });
      expect(receivedBatches[0].user_identities).toEqual({ email: 'test@example.com' });
      expect(receivedBatches[0].events.length).toBe(1);
    });

    it('should not add extra events when pendingIdentityEvents is empty', async () => {
      const receivedBatches: any[] = [];
      (window as any).Rokt.__batch_stream__ = function (payload: any) {
        receivedBatches.push(payload);
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});
      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect((window as any).mParticle.forwarder.pendingIdentityEvents.length).toBe(0);

      (window as any).mParticle.forwarder.processBatch(mockBatch);

      expect(receivedBatches.length).toBe(1);
      expect(receivedBatches[0].events.length).toBe(1);
      expect(receivedBatches[0].events[0].event_type).toBe('custom_event');
    });

    it('should queue batch in batchQueue when kit is not initialized', () => {
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.forwarder.launcher = null;

      expect(() => {
        (window as any).mParticle.forwarder.processBatch(mockBatch);
      }).not.toThrow();

      expect((window as any).mParticle.forwarder.batchQueue.length).toBe(1);
      expect((window as any).mParticle.forwarder.batchQueue[0]).toEqual(mockBatch);
    });

    it('should flush batchQueue when kit becomes ready', async () => {
      const receivedBatches: any[] = [];
      (window as any).Rokt.__batch_stream__ = function (payload: any) {
        receivedBatches.push(payload);
      };

      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.forwarder.launcher = null;
      (window as any).mParticle.forwarder.processBatch(mockBatch);

      expect((window as any).mParticle.forwarder.batchQueue.length).toBe(1);

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect(receivedBatches.length).toBe(1);
      expect(receivedBatches[0].mpid).toBe('test-mpid-123');
      expect((window as any).mParticle.forwarder.batchQueue.length).toBe(0);
    });

    it('should queue batch in batchStreamQueue when window.Rokt.__batch_stream__ is not defined', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      expect(() => {
        (window as any).mParticle.forwarder.processBatch(mockBatch);
      }).not.toThrow();

      expect((window as any).mParticle.forwarder.batchStreamQueue.length).toBe(1);
      expect((window as any).mParticle.forwarder.batchStreamQueue[0]).toEqual(mockBatch);
    });

    it('should queue batch in batchStreamQueue when window.Rokt is undefined', async () => {
      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      const savedRokt = (window as any).Rokt;
      delete (window as any).Rokt;

      expect(() => {
        (window as any).mParticle.forwarder.processBatch(mockBatch);
      }).not.toThrow();

      expect((window as any).mParticle.forwarder.batchStreamQueue.length).toBe(1);
      expect((window as any).mParticle.forwarder.batchStreamQueue[0]).toEqual(mockBatch);

      (window as any).Rokt = savedRokt;
    });

    it('should flush batchStreamQueue before sending the next batch', async () => {
      const receivedBatches: any[] = [];

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      const batchA = { mpid: 'mpid-A', events: [], user_attributes: {} };
      const batchB = { mpid: 'mpid-B', events: [], user_attributes: {} };
      const batchC = { mpid: 'mpid-C', events: [], user_attributes: {} };

      (window as any).mParticle.forwarder.processBatch(batchA);
      (window as any).mParticle.forwarder.processBatch(batchB);

      expect((window as any).mParticle.forwarder.batchStreamQueue.length).toBe(2);

      (window as any).Rokt.__batch_stream__ = function (payload: any) {
        receivedBatches.push(payload);
      };

      (window as any).mParticle.forwarder.processBatch(batchC);

      expect(receivedBatches.length).toBe(3);
      expect(receivedBatches[0].mpid).toBe('mpid-A');
      expect(receivedBatches[1].mpid).toBe('mpid-B');
      expect(receivedBatches[2].mpid).toBe('mpid-C');
      expect((window as any).mParticle.forwarder.batchStreamQueue.length).toBe(0);
    });

    it('should add an identity event to pendingIdentityEvents on onLoginComplete', () => {
      const mockUser = {
        getMPID: () => '123',
        getAllUserAttributes: () => ({}),
        getUserIdentities: () => ({ userIdentities: {} }),
      };

      (window as any).mParticle.forwarder.onLoginComplete(mockUser, null);

      const pending = (window as any).mParticle.forwarder.pendingIdentityEvents;
      expect(pending.length).toBe(1);
      expect(pending[0].event_type).toBe('login');
      expect(pending[0].data.timestamp_unixtime_ms).toBeTypeOf('number');
    });

    it('should add an identity event to pendingIdentityEvents on onLogoutComplete', () => {
      const mockUser = {
        getMPID: () => '123',
        getAllUserAttributes: () => ({}),
        getUserIdentities: () => ({ userIdentities: {} }),
      };

      (window as any).mParticle.forwarder.onLogoutComplete(mockUser, null);

      const pending = (window as any).mParticle.forwarder.pendingIdentityEvents;
      expect(pending.length).toBe(1);
      expect(pending[0].event_type).toBe('logout');
      expect(pending[0].data.timestamp_unixtime_ms).toBeTypeOf('number');
    });

    it('should add identity events to pendingIdentityEvents on onModifyComplete and onUserIdentified', () => {
      const mockUser = {
        getMPID: () => '42',
        getAllUserAttributes: () => ({}),
        getUserIdentities: () => ({ userIdentities: {} }),
      };

      (window as any).mParticle.forwarder.onModifyComplete(mockUser, null);
      (window as any).mParticle.forwarder.onUserIdentified(mockUser);

      const pending = (window as any).mParticle.forwarder.pendingIdentityEvents;
      expect(pending.length).toBe(2);
      expect(pending[0].event_type).toBe('modify_user');
      expect(pending[1].event_type).toBe('identify');
    });

    it('should merge pendingIdentityEvents into the outgoing batch and clear the queue', async () => {
      const receivedBatches: any[] = [];
      (window as any).Rokt.__batch_stream__ = function (payload: any) {
        receivedBatches.push(payload);
      };

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});
      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      const mockUser = {
        getMPID: () => '123',
        getAllUserAttributes: () => ({}),
        getUserIdentities: () => ({ userIdentities: {} }),
      };

      (window as any).mParticle.forwarder.onLoginComplete(mockUser, null);
      expect((window as any).mParticle.forwarder.pendingIdentityEvents.length).toBe(1);

      (window as any).mParticle.forwarder.processBatch(mockBatch);

      expect(receivedBatches.length).toBe(1);
      // Original 1 custom_event + 1 identity event from onLoginComplete
      expect(receivedBatches[0].events.length).toBe(2);
      expect(receivedBatches[0].events[1].event_type).toBe('login');
      expect(receivedBatches[0].events[1].data.timestamp_unixtime_ms).toBeTypeOf('number');
      // Queue should be cleared after flush
      expect((window as any).mParticle.forwarder.pendingIdentityEvents.length).toBe(0);
    });

    it('should merge pendingIdentityEvents into the first queued batch when kit becomes ready', async () => {
      const receivedBatches: any[] = [];
      (window as any).Rokt.__batch_stream__ = function (payload: any) {
        receivedBatches.push(payload);
      };

      // Queue a batch before the kit initialises
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.forwarder.launcher = null;

      const mockUser = {
        getMPID: () => '123',
        getAllUserAttributes: () => ({}),
        getUserIdentities: () => ({ userIdentities: {} }),
      };

      // Identity callback fires before kit is ready
      (window as any).mParticle.forwarder.onLoginComplete(mockUser, null);
      (window as any).mParticle.forwarder.processBatch(mockBatch);

      expect((window as any).mParticle.forwarder.batchQueue.length).toBe(1);
      expect((window as any).mParticle.forwarder.pendingIdentityEvents.length).toBe(1);

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});
      await waitForCondition(() => (window as any).mParticle.Rokt.attachKitCalled);

      // The queued batch should have the pending identity event merged in
      expect(receivedBatches.length).toBe(1);
      expect(receivedBatches[0].events.length).toBe(2);
      expect(receivedBatches[0].events[1].event_type).toBe('login');
      expect((window as any).mParticle.forwarder.pendingIdentityEvents.length).toBe(0);
      expect((window as any).mParticle.forwarder.batchQueue.length).toBe(0);
    });
  });

  describe('#_setRoktSessionId', () => {
    let setIntegrationAttributeCalls: any[];

    beforeEach(() => {
      setIntegrationAttributeCalls = [];
      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.setLocalSessionAttribute = function (key: any, value: any) {
        (window as any).mParticle._Store.localSessionAttributes[key] = value;
      };
      (window as any).mParticle.Rokt.getLocalSessionAttributes = function () {
        return (window as any).mParticle._Store.localSessionAttributes;
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributeFilters: [],
        filterUserAttributes: function (attributes: any) {
          return attributes;
        },
        filteredUser: {
          getMPID: function () {
            return '123';
          },
        },
      };
      (window as any).mParticle.getInstance = function () {
        return {
          setIntegrationAttribute: function (id: any, attrs: any) {
            setIntegrationAttributeCalls.push({
              id: id,
              attrs: attrs,
            });
          },
        };
      };
    });

    afterEach(() => {
      delete (window as any).mParticle.getInstance;
      (window as any).mParticle.forwarder.isInitialized = false;
      (window as any).mParticle.Rokt.attachKitCalled = false;
    });

    function createMockSelection(sessionId: any) {
      return {
        context: {
          sessionId: sessionId ? Promise.resolve(sessionId) : Promise.resolve(''),
        },
      };
    }

    function setupLauncherWithSelection(mockSelection: any) {
      (window as any).Rokt.createLauncher = async function (_options: any) {
        return Promise.resolve({
          selectPlacements: function () {
            return Promise.resolve(mockSelection);
          },
        });
      };
    }

    it('should set integration attribute when session ID is available via context', async () => {
      const mockSelection = createMockSelection('rokt-session-abc');
      setupLauncherWithSelection(mockSelection);

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      await (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {},
      });

      await waitForCondition(() => setIntegrationAttributeCalls.length > 0);

      expect(setIntegrationAttributeCalls.length).toBe(1);
      expect(setIntegrationAttributeCalls[0].id).toBe(181);
      expect(setIntegrationAttributeCalls[0].attrs).toEqual({
        roktSessionId: 'rokt-session-abc',
      });
    });

    it('should not set integration attribute when session ID is empty', async () => {
      const mockSelection = createMockSelection('');
      setupLauncherWithSelection(mockSelection);

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      await (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {},
      });

      // Give time for any async operations to settle
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(setIntegrationAttributeCalls.length).toBe(0);
    });

    it('should not throw when mParticle.getInstance is unavailable', async () => {
      const mockSelection = createMockSelection('rokt-session-abc');
      setupLauncherWithSelection(mockSelection);
      delete (window as any).mParticle.getInstance;

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      // Should not throw
      await (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {},
      });

      // Give time for async operations
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(setIntegrationAttributeCalls.length).toBe(0);
    });

    it('should return the selection promise to callers', async () => {
      const mockSelection = createMockSelection('rokt-session-abc');
      setupLauncherWithSelection(mockSelection);

      await (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      const result = await (window as any).mParticle.forwarder.selectPlacements({
        identifier: 'test-placement',
        attributes: {},
      });

      expect(result).toBe(mockSelection);
    });
  });

  describe('#parseSettingsString', () => {
    it('should parse null values in a settings string appropriately', () => {
      const settingsString =
        '[{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;f.name&quot;,&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;firstname&quot;},{&quot;jsmap&quot;:null,&quot;map&quot;:&quot;last_name&quot;,&quot;maptype&quot;:&quot;UserAttributeClass.Name&quot;,&quot;value&quot;:&quot;lastname&quot;}]';

      expect((window as any).mParticle.forwarder.testHelpers.parseSettingsString(settingsString)).toEqual([
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

      expect((window as any).mParticle.forwarder.testHelpers.parseSettingsString(settingsString)).toEqual([
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

      expect((window as any).mParticle.forwarder.testHelpers.parseSettingsString(settingsString)).toEqual([]);
    });

    it('returns an empty array if the settings string is not a valid JSON', () => {
      const settingsString = 'not a valid JSON';

      expect((window as any).mParticle.forwarder.testHelpers.parseSettingsString(settingsString)).toEqual([]);
    });
  });

  describe('#hashEventMessage', () => {
    it('should hash event message using generateHash in the proper order', () => {
      const eventName = 'Test Event';
      const eventType = EventType.Other;
      const messageType = MessageType.PageEvent;
      const resultHash = (window as any).mParticle.forwarder.testHelpers.hashEventMessage(
        messageType,
        eventType,
        eventName,
      );

      // Order should be messageType (4), eventType (8), eventName (Test Event)
      expect(resultHash).toBe('hashed-<48Test Event>-value');
    });
  });

  describe('#createAutoRemovedIframe', () => {
    beforeEach(() => {
      (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true);
    });

    it('should create a hidden iframe with the given src and append it to the document', () => {
      const src = 'https://example.com/test';
      (window as any).mParticle.forwarder.testHelpers.createAutoRemovedIframe(src);

      const iframe = document.querySelector('iframe[src="' + src + '"]') as HTMLIFrameElement;
      expect(iframe).toBeTruthy();
      expect(iframe.style.display).toBe('none');
      expect(iframe.getAttribute('sandbox')).toBe('allow-scripts allow-same-origin');
    });

    it('should remove the iframe from the DOM after it loads', () => {
      const src = 'https://example.com/auto-remove-test';
      (window as any).mParticle.forwarder.testHelpers.createAutoRemovedIframe(src);

      const iframe = document.querySelector('iframe[src="' + src + '"]') as any;
      expect(iframe).toBeTruthy();

      // Simulate load event
      iframe.onload();

      // iframe should be removed
      const removed = document.querySelector('iframe[src="' + src + '"]');
      expect(removed).toBeNull();
    });
  });

  describe('#sendAdBlockMeasurementSignals', () => {
    let originalRandom: () => number;

    beforeEach(() => {
      originalRandom = Math.random;
      (window as any).mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true);
      // Set allowed origin hash to match the test environment origin
      const testOriginHash = (window as any).mParticle.forwarder.testHelpers.djb2(window.location.origin);
      (window as any).mParticle.forwarder.testHelpers.setAllowedOriginHashes([testOriginHash]);
      // Clean up any iframes from previous tests
      document.querySelectorAll('iframe').forEach((iframe) => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      });
    });

    afterEach(() => {
      Math.random = originalRandom;
      delete (window as any).__rokt_li_guid__;
      // Clean up iframes
      document.querySelectorAll('iframe').forEach((iframe) => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      });
    });

    it('should create two iframes with correct URLs when sampled in and guid is set', () => {
      Math.random = () => 0.05; // Below 0.1 threshold
      (window as any).__rokt_li_guid__ = 'test-guid-123';

      (window as any).mParticle.forwarder.testHelpers.sendAdBlockMeasurementSignals('custom.rokt.com', 'test-version');

      const iframes = document.querySelectorAll('iframe');
      const srcs = Array.prototype.map.call(iframes, (iframe: any) => iframe.src) as string[];

      expect(srcs.length).toBeGreaterThanOrEqual(2);

      const existingDomainIframe = srcs.find((src) => src.indexOf('custom.rokt.com/v1/wsdk-init/index.html') !== -1);
      const controlDomainIframe = srcs.find(
        (src) => src.indexOf('apps.roktecommerce.com/v1/wsdk-init/index.html') !== -1,
      );

      expect(existingDomainIframe).toBeTruthy();
      expect(controlDomainIframe).toBeTruthy();

      expect(existingDomainIframe).toContain('version=test-version');
      expect(existingDomainIframe).toContain('launcherInstanceGuid=test-guid-123');
      expect(existingDomainIframe).not.toContain('isControl');

      expect(controlDomainIframe).toContain('version=test-version');
      expect(controlDomainIframe).toContain('launcherInstanceGuid=test-guid-123');
      expect(controlDomainIframe).toContain('isControl=true');
    });

    it('should use apps.rokt.com as the default domain when no domain is provided', () => {
      Math.random = () => 0.05;
      (window as any).__rokt_li_guid__ = 'test-guid-123';

      (window as any).mParticle.forwarder.testHelpers.sendAdBlockMeasurementSignals(undefined, 'test-version');

      const iframes = document.querySelectorAll('iframe');
      const srcs = Array.prototype.map.call(iframes, (iframe: any) => iframe.src) as string[];

      const defaultDomainIframe = srcs.find(
        (src) =>
          src.indexOf('apps.rokt.com/v1/wsdk-init/index.html') !== -1 && src.indexOf('apps.roktecommerce.com') === -1,
      );

      expect(defaultDomainIframe).toBeTruthy();
    });

    it('should not create iframes when sampled out', () => {
      Math.random = () => 0.5; // Above 0.1 threshold
      (window as any).__rokt_li_guid__ = 'test-guid-123';

      const iframeCountBefore = document.querySelectorAll('iframe').length;

      (window as any).mParticle.forwarder.testHelpers.sendAdBlockMeasurementSignals('apps.rokt.com', 'test-version');

      const iframeCountAfter = document.querySelectorAll('iframe').length;
      expect(iframeCountAfter).toBe(iframeCountBefore);
    });

    it('should not create iframes when __rokt_li_guid__ is not set', () => {
      Math.random = () => 0.05;
      delete (window as any).__rokt_li_guid__;

      const iframeCountBefore = document.querySelectorAll('iframe').length;

      (window as any).mParticle.forwarder.testHelpers.sendAdBlockMeasurementSignals('apps.rokt.com', 'test-version');

      const iframeCountAfter = document.querySelectorAll('iframe').length;
      expect(iframeCountAfter).toBe(iframeCountBefore);
    });

    it('should not create iframes when origin does not match allowed hash', () => {
      Math.random = () => 0.05;
      (window as any).__rokt_li_guid__ = 'test-guid-123';

      // Set to a hash that won't match any real origin
      (window as any).mParticle.forwarder.testHelpers.setAllowedOriginHashes([0]);

      const iframeCountBefore = document.querySelectorAll('iframe').length;

      (window as any).mParticle.forwarder.testHelpers.sendAdBlockMeasurementSignals('apps.rokt.com', 'test-version');

      const iframeCountAfter = document.querySelectorAll('iframe').length;
      expect(iframeCountAfter).toBe(iframeCountBefore);
    });

    it('should strip hash fragments from pageUrl', () => {
      Math.random = () => 0.05;
      (window as any).__rokt_li_guid__ = 'test-guid-123';

      // window.location.href in test env won't have a fragment,
      // but we can verify the pageUrl param does not contain '#'
      (window as any).mParticle.forwarder.testHelpers.sendAdBlockMeasurementSignals('apps.rokt.com', 'test-version');

      const iframes = document.querySelectorAll('iframe');
      const srcs = Array.prototype.map.call(iframes, (iframe: any) => iframe.src) as string[];

      srcs.forEach((src) => {
        expect(src).toContain('pageUrl=');
        // Extract the pageUrl param value
        const match = src.match(/pageUrl=([^&]*)/);
        expect(match).toBeTruthy();
        const decodedPageUrl = decodeURIComponent(match![1]);
        expect(decodedPageUrl).not.toContain('#');
        expect(decodedPageUrl).not.toContain('?');
      });
    });

    it('should fire measurement signals during initRoktLauncher when guid exists', async () => {
      Math.random = () => 0.05;
      (window as any).__rokt_li_guid__ = 'init-test-guid';
      // Ensure origin hash matches test environment
      const testOriginHash = (window as any).mParticle.forwarder.testHelpers.djb2(window.location.origin);
      (window as any).mParticle.forwarder.testHelpers.setAllowedOriginHashes([testOriginHash]);

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
          return attributes;
        },
        filteredUser: {
          getMPID: function () {
            return '123';
          },
        },
      };

      await mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      const iframes = document.querySelectorAll('iframe');
      const srcs = Array.prototype.map.call(iframes, (iframe: any) => iframe.src) as string[];

      const controlIframe = srcs.find((src) => src.indexOf('apps.roktecommerce.com/v1/wsdk-init/index.html') !== -1);

      expect(controlIframe).toBeTruthy();
      expect(controlIframe).toContain('launcherInstanceGuid=init-test-guid');
    });

    it('should not fire measurement signals during init when guid is absent', async () => {
      Math.random = () => 0.05;
      delete (window as any).__rokt_li_guid__;
      // Ensure origin hash matches test environment
      const testOriginHash = (window as any).mParticle.forwarder.testHelpers.djb2(window.location.origin);
      (window as any).mParticle.forwarder.testHelpers.setAllowedOriginHashes([testOriginHash]);

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
        Promise.resolve();
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: function (attributes: any) {
          return attributes;
        },
        filteredUser: {
          getMPID: function () {
            return '123';
          },
        },
      };

      await mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      await waitForCondition(() => (window as any).mParticle.forwarder.isInitialized);

      const iframes = document.querySelectorAll('iframe');
      const srcs = Array.prototype.map.call(iframes, (iframe: any) => iframe.src) as string[];

      const controlIframe = srcs.find((src) => src.indexOf('apps.roktecommerce.com/v1/wsdk-init/index.html') !== -1);

      expect(controlIframe).toBeUndefined();
    });
  });

  describe('ErrorReportingService', () => {
    let originalFetch: typeof window.fetch;
    let fetchCalls: Array<{ url: string; options: any }>;
    const originalROKT_DOMAIN_ref = { value: (window as any).ROKT_DOMAIN };

    beforeEach(() => {
      fetchCalls = [];
      originalFetch = window.fetch;
      (window as any).fetch = (url: string, options: any) => {
        fetchCalls.push({ url, options });
        return Promise.resolve({ ok: true });
      };
      originalROKT_DOMAIN_ref.value = (window as any).ROKT_DOMAIN;
      (window as any).ROKT_DOMAIN = 'set';
    });

    afterEach(() => {
      window.fetch = originalFetch;
      (window as any).ROKT_DOMAIN = originalROKT_DOMAIN_ref.value;
    });

    it('should send error reports to the errors endpoint', () => {
      const service = new ErrorReportingServiceClass(
        { errorUrl: 'test.com/v1/errors', isLoggingEnabled: true },
        '1.0.0',
        'test-guid',
      );
      service.report({
        message: 'test error',
        code: ErrorCodesConst.UNHANDLED_EXCEPTION,
        severity: WSDKErrorSeverityConst.ERROR,
        stackTrace: 'stack',
      });
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].url).toBe('https://test.com/v1/errors');
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.severity).toBe('ERROR');
      expect(body.code).toBe('UNHANDLED_EXCEPTION');
      expect(body.stackTrace).toBe('stack');
      expect(body.reporter).toBe('mp-wsdk');
    });

    it('should send warning reports to the errors endpoint', () => {
      const service = new ErrorReportingServiceClass(
        { errorUrl: 'test.com/v1/errors', isLoggingEnabled: true },
        '1.0.0',
        'test-guid',
      );
      service.report({
        message: 'test warning',
        code: ErrorCodesConst.UNHANDLED_EXCEPTION,
        severity: WSDKErrorSeverityConst.WARNING,
      });
      expect(fetchCalls.length).toBe(1);
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.severity).toBe('WARNING');
    });

    it('should send info reports to the errors endpoint', () => {
      const service = new ErrorReportingServiceClass(
        { errorUrl: 'test.com/v1/errors', isLoggingEnabled: true },
        '1.0.0',
        'test-guid',
      );
      service.report({
        message: 'info message',
        code: ErrorCodesConst.UNHANDLED_EXCEPTION,
        severity: WSDKErrorSeverityConst.INFO,
      });
      expect(fetchCalls.length).toBe(1);
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.severity).toBe('INFO');
    });

    it('should not send when ROKT_DOMAIN is missing and feature flag is off', () => {
      (window as any).ROKT_DOMAIN = undefined;
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: false }, '1.0.0', 'test-guid');
      service.report({ message: 'should not send', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls.length).toBe(0);
    });

    it('should not send when feature flag is off and debug mode is off', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: false }, '1.0.0', 'test-guid');
      service.report({ message: 'should not send', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls.length).toBe(0);
    });

    it('should send when debug mode is enabled even without ROKT_DOMAIN', () => {
      (window as any).ROKT_DOMAIN = undefined;
      const originalSearch = window.location.search;
      window.history.pushState({}, '', window.location.pathname + '?mp_enable_logging=true');
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: false }, '1.0.0', 'test-guid');
      service.report({ message: 'debug message', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls.length).toBe(1);
      window.history.pushState({}, '', window.location.pathname + originalSearch);
    });

    it('should include correct headers', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls.length).toBe(1);
      const headers = fetchCalls[0].options.headers;
      expect(headers['Accept']).toBe('text/plain;charset=UTF-8');
      expect(headers['Content-Type']).toBe('application/json');
      expect(headers['rokt-launcher-instance-guid']).toBe('test-guid');
      expect(headers['rokt-wsdk-version']).toBe('joint');
    });

    it('should omit rokt-launcher-instance-guid header when guid is undefined', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', undefined);
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].options.headers['rokt-launcher-instance-guid']).toBeUndefined();
    });

    it('should include rokt-account-id header when accountId is provided', () => {
      const service = new ErrorReportingServiceClass(
        { isLoggingEnabled: true },
        'test-integration',
        'test-guid',
        '1234567890',
      );
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.WARNING });
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].options.headers['rokt-account-id']).toBe('1234567890');
    });

    it('should not include rokt-account-id header when accountId is not provided', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, 'test-integration', 'test-guid');
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].options.headers['rokt-account-id']).toBeUndefined();
    });

    it('should use default UNKNOWN_ERROR code when code is not provided', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.ERROR });
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.code).toBe('UNKNOWN_ERROR');
    });

    it('should use default Rokt error URL when not configured', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      service.report({ message: 'test error', severity: WSDKErrorSeverityConst.ERROR });
      expect(fetchCalls[0].url).toBe('https://apps.rokt-api.com/v1/errors');
    });

    it('should include all required fields in the log request body', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, 'test-integration', 'test-guid');
      service.report({
        message: 'error message',
        code: ErrorCodesConst.IDENTITY_REQUEST,
        severity: WSDKErrorSeverityConst.ERROR,
        stackTrace: 'stack trace here',
      });
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.additionalInformation.message).toBe('error message');
      expect(body.additionalInformation.version).toBe('test-integration');
      expect(body.severity).toBe('ERROR');
      expect(body.code).toBe('IDENTITY_REQUEST');
      expect(body.stackTrace).toBe('stack trace here');
      expect(body.reporter).toBe('mp-wsdk');
      expect(body.integration).toBe('test-integration');
    });

    it('should use empty integration values when no integration name is provided', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '', 'test-guid');
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.ERROR });
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.reporter).toBe('mp-wsdk');
      expect(body.integration).toBe('');
      expect(body.additionalInformation.version).toBe('');
    });

    it('should not throw when fetch fails', async () => {
      (window as any).fetch = () => Promise.reject(new Error('Network failure'));
      const consoleErrors: any[][] = [];
      const originalConsoleError = console.error;
      console.error = (...args: any[]) => {
        consoleErrors.push(args);
      };

      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      service.report({ message: 'test', severity: WSDKErrorSeverityConst.ERROR });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(consoleErrors.length).toBeGreaterThan(0);
      expect(consoleErrors[0][0]).toBe('ReportingTransport: Failed to send log');
      console.error = originalConsoleError;
    });

    it('should not send when report is called with null', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      service.report(null);
      expect(fetchCalls.length).toBe(0);
    });
  });

  describe('LoggingService', () => {
    let originalFetch: typeof window.fetch;
    let fetchCalls: Array<{ url: string; options: any }>;
    const originalROKT_DOMAIN_ref = { value: (window as any).ROKT_DOMAIN };

    beforeEach(() => {
      fetchCalls = [];
      originalFetch = window.fetch;
      (window as any).fetch = (url: string, options: any) => {
        fetchCalls.push({ url, options });
        return Promise.resolve({ ok: true });
      };
      originalROKT_DOMAIN_ref.value = (window as any).ROKT_DOMAIN;
      (window as any).ROKT_DOMAIN = 'set';
    });

    afterEach(() => {
      window.fetch = originalFetch;
      (window as any).ROKT_DOMAIN = originalROKT_DOMAIN_ref.value;
    });

    it('should always send to the logging endpoint with severity INFO', () => {
      const errorService = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      const service = new LoggingServiceClass(
        { loggingUrl: 'test.com/v1/log', isLoggingEnabled: true },
        errorService,
        '1.0.0',
        'test-guid',
      );
      service.log({ message: 'log entry', code: ErrorCodesConst.UNKNOWN_ERROR });
      expect(fetchCalls.length).toBe(1);
      expect(fetchCalls[0].url).toBe('https://test.com/v1/log');
      const body = JSON.parse(fetchCalls[0].options.body);
      expect(body.severity).toBe('INFO');
      expect(body.additionalInformation.message).toBe('log entry');
    });

    it('should report failure through ErrorReportingService on fetch error', async () => {
      const errorReports: any[] = [];
      const errorService = {
        report: (error: any) => {
          errorReports.push(error);
        },
      };
      (window as any).fetch = () => Promise.reject(new Error('Network failure'));
      const originalConsoleError = console.error;
      console.error = () => {};

      const service = new LoggingServiceClass({ isLoggingEnabled: true }, errorService, '1.0.0', 'test-guid');
      service.log({ message: 'test' });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(errorReports.length).toBeGreaterThan(0);
      expect(errorReports[0].severity).toBe('ERROR');
      expect(errorReports[0].message).toContain('Failed to send log');
      console.error = originalConsoleError;
    });

    it('should not send when log is called with null', () => {
      const errorService = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      const service = new LoggingServiceClass({ isLoggingEnabled: true }, errorService, '1.0.0', 'test-guid');
      service.log(null);
      expect(fetchCalls.length).toBe(0);
    });
  });

  describe('RateLimiter', () => {
    it('should allow up to 10 logs per severity then rate limit', () => {
      const limiter = new RateLimiterClass();
      for (let i = 0; i < 10; i++) {
        expect(limiter.incrementAndCheck('ERROR')).toBe(false);
      }
      expect(limiter.incrementAndCheck('ERROR')).toBe(true);
      expect(limiter.incrementAndCheck('ERROR')).toBe(true);
    });

    it('should allow up to 10 warning logs then rate limit', () => {
      const limiter = new RateLimiterClass();
      for (let i = 0; i < 10; i++) {
        expect(limiter.incrementAndCheck('WARNING')).toBe(false);
      }
      expect(limiter.incrementAndCheck('WARNING')).toBe(true);
    });

    it('should allow up to 10 info logs then rate limit', () => {
      const limiter = new RateLimiterClass();
      for (let i = 0; i < 10; i++) {
        expect(limiter.incrementAndCheck('INFO')).toBe(false);
      }
      expect(limiter.incrementAndCheck('INFO')).toBe(true);
    });

    it('should track rate limits independently per severity', () => {
      const limiter = new RateLimiterClass();
      for (let i = 0; i < 10; i++) {
        limiter.incrementAndCheck('ERROR');
      }
      expect(limiter.incrementAndCheck('ERROR')).toBe(true);
      expect(limiter.incrementAndCheck('WARNING')).toBe(false);
    });
  });

  describe('ErrorReportingService rate limiting', () => {
    let originalFetch: typeof window.fetch;
    let fetchCalls: Array<{ url: string; options: any }>;
    const originalROKT_DOMAIN_ref = { value: (window as any).ROKT_DOMAIN };

    beforeEach(() => {
      fetchCalls = [];
      originalFetch = window.fetch;
      (window as any).fetch = (url: string, options: any) => {
        fetchCalls.push({ url, options });
        return Promise.resolve({ ok: true });
      };
      originalROKT_DOMAIN_ref.value = (window as any).ROKT_DOMAIN;
      (window as any).ROKT_DOMAIN = 'set';
    });

    afterEach(() => {
      window.fetch = originalFetch;
      (window as any).ROKT_DOMAIN = originalROKT_DOMAIN_ref.value;
    });

    it('should rate limit after 10 errors', () => {
      const service = new ErrorReportingServiceClass({ isLoggingEnabled: true }, '1.0.0', 'test-guid');
      for (let i = 0; i < 15; i++) {
        service.report({ message: `error ${i}`, severity: WSDKErrorSeverityConst.ERROR });
      }
      expect(fetchCalls.length).toBe(10);
    });

    it('should rate limit with custom rate limiter', () => {
      let count = 0;
      const customLimiter = { incrementAndCheck: () => ++count > 3 };
      const service = new ErrorReportingServiceClass(
        { isLoggingEnabled: true },
        'test-integration',
        'test-guid',
        null,
        customLimiter,
      );
      for (let i = 0; i < 5; i++) {
        service.report({ message: `error ${i}`, severity: WSDKErrorSeverityConst.ERROR });
      }
      expect(fetchCalls.length).toBe(3);
    });
  });

  describe('Reporting service registration', () => {
    it('should register services with mParticle if methods exist', async () => {
      let registeredErrorService: any = null;
      let registeredLoggingService: any = null;

      (window as any).mParticle._registerErrorReportingService = (service: any) => {
        registeredErrorService = service;
      };
      (window as any).mParticle._registerLoggingService = (service: any) => {
        registeredLoggingService = service;
      };

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKitCalled = false;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.attachKitCalled = true;
        (window as any).mParticle.Rokt.kit = kit;
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: { getMPID: () => '123' },
      };

      await mParticle.forwarder.init(
        { accountId: '123456', isLoggingEnabled: 'true' },
        reportService.cb,
        true,
        null,
        {},
      );

      expect(registeredErrorService).not.toBeNull();
      expect(registeredLoggingService).not.toBeNull();
      expect(typeof registeredErrorService.report).toBe('function');
      expect(typeof registeredLoggingService.log).toBe('function');

      delete (window as any).mParticle._registerErrorReportingService;
      delete (window as any).mParticle._registerLoggingService;
    });

    it('should not throw when registration methods do not exist', async () => {
      delete (window as any).mParticle._registerErrorReportingService;
      delete (window as any).mParticle._registerLoggingService;

      (window as any).Rokt = new (MockRoktForwarder as any)();
      (window as any).mParticle.Rokt = (window as any).Rokt;
      (window as any).mParticle.Rokt.attachKit = async (kit: any) => {
        (window as any).mParticle.Rokt.kit = kit;
      };
      (window as any).mParticle.Rokt.filters = {
        userAttributesFilters: [],
        filterUserAttributes: (attributes: any) => attributes,
        filteredUser: { getMPID: () => '123' },
      };

      await mParticle.forwarder.init({ accountId: '123456' }, reportService.cb, true, null, {});

      expect((window as any).mParticle.forwarder.isInitialized).toBeDefined();
    });
  });
});

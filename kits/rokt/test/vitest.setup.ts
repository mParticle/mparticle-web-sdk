// Global test setup for Vitest.
// This file runs before each test file.
// It sets up the window.mParticle mock so the kit can self-register when imported.

// Set up global mParticle mock before any test files load.
// The kit self-registers via window.mParticle.addForwarder() at module load time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).mParticle = {
  addForwarder: function (forwarder: { name: string; constructor: new () => unknown }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).mParticle.forwarder = new forwarder.constructor();
  },
  Rokt: {},
  EventType: { Other: 8 },
  getEnvironment: () => 'development',
  getVersion: () => '1.2.3',
  Identity: {
    getCurrentUser: () => ({
      getMPID: () => '123',
    }),
  },
  _Store: { localSessionAttributes: {} },
  sessionManager: {
    getSession: () => 'test-mp-session-id',
  },
  _getActiveForwarders: () => [],
  generateHash: (input: string) => 'hashed-<' + input + '>-value',
  loggedEvents: [] as unknown[],
  logEvent: function (eventName: string, eventType: unknown, eventAttributes: unknown) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).mParticle.loggedEvents.push({ eventName, eventType, eventAttributes });
  },
  getInstance: () => ({
    setIntegrationAttribute: () => {},
  }),
  captureTiming: () => {},
};

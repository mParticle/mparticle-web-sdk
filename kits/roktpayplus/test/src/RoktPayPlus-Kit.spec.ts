import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { SDKEvent } from '@mparticle/web-sdk/internal';
import { RoktPayPlusKit } from '../../src/RoktPayPlus-Kit';

const PAGE_VIEW = 3;
const PAGE_EVENT = 4;
const SESSION_START = 1;

interface Posted {
  message: { source: string; type: string; detail?: Record<string, unknown> };
  targetOrigin: string;
}

function pageView(name: string, attrs: Record<string, string> = {}): SDKEvent {
  return { EventDataType: PAGE_VIEW, EventName: name, EventAttributes: attrs } as unknown as SDKEvent;
}
function customEvent(name: string, attrs: Record<string, string> = {}): SDKEvent {
  return { EventDataType: PAGE_EVENT, EventName: name, EventAttributes: attrs } as unknown as SDKEvent;
}

describe('RoktPayPlusKit', () => {
  let posted: Posted[];
  let parentDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    posted = [];
    // Pay+ runs in an iframe; the kit posts to window.parent. Stub it to capture.
    parentDescriptor = Object.getOwnPropertyDescriptor(window, 'parent');
    Object.defineProperty(window, 'parent', {
      value: {
        postMessage: (message: Posted['message'], targetOrigin: string) => posted.push({ message, targetOrigin }),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    if (parentDescriptor) {
      Object.defineProperty(window, 'parent', parentDescriptor);
    }
  });

  const typesOf = () => posted.map((p) => p.message.type);
  const ofType = (t: string) => posted.filter((p) => p.message.type === t);

  describe('default behavior (no settings)', () => {
    let kit: RoktPayPlusKit;
    beforeEach(() => {
      kit = new RoktPayPlusKit();
      kit.init({});
    });

    it('emits initiated on init', () => {
      expect(ofType('initiated').length).toBe(1);
      expect(posted[0].message.source).toBe('rokt-payplus-kit');
      expect(posted[0].targetOrigin).toBe('*');
    });

    it('emits stepComplete for any page view', () => {
      kit.process(pageView('signup-email'));
      const steps = ofType('stepComplete');
      expect(steps.length).toBe(1);
      expect(steps[0].message.detail).toEqual({ step: 'signup-email' });
    });

    it('emits approved for a custom event named conversion', () => {
      kit.process(customEvent('conversion', { conversiontype: 'signup' }));
      const approved = ofType('approved');
      expect(approved.length).toBe(1);
      expect(approved[0].message.detail).toEqual({ conversiontype: 'signup' });
    });

    it('ignores custom events that are not the conversion', () => {
      kit.process(customEvent('Button Clicked'));
      expect(ofType('approved').length).toBe(0);
      expect(ofType('stepComplete').length).toBe(0);
    });

    it('does not emit on session start', () => {
      kit.process({ EventDataType: SESSION_START } as unknown as SDKEvent);
      expect(typesOf().filter((t) => t !== 'initiated').length).toBe(0);
    });
  });

  describe('configured funnel', () => {
    let kit: RoktPayPlusKit;
    beforeEach(() => {
      kit = new RoktPayPlusKit();
      kit.init({
        progressionScreenNames: 'signup-password, signup-verify',
        approvedEventName: 'Account Created',
      });
    });

    it('emits stepComplete only for the configured progression screens', () => {
      kit.process(pageView('signup-email'));
      kit.process(pageView('signup-password'));
      kit.process(pageView('signup-verify'));
      const steps = ofType('stepComplete');
      expect(steps.length).toBe(2);
      expect(steps.map((s) => s.message.detail)).toEqual([{ step: 'signup-password' }, { step: 'signup-verify' }]);
    });

    it('reads the screen name from the screen_name attribute, not the generic page name', () => {
      kit.process(pageView('page view', { screen_name: 'signup-verify', url: 'https://example.com/signup' }));
      const steps = ofType('stepComplete');
      expect(steps.length).toBe(1);
      expect(steps[0].message.detail).toEqual({ step: 'signup-verify' });
    });

    it('emits approved on the configured conversion custom event', () => {
      kit.process(customEvent('Account Created', { plan: 'pro' }));
      const approved = ofType('approved');
      expect(approved.length).toBe(1);
      expect(approved[0].message.detail).toEqual({ plan: 'pro' });
    });

    it('does not treat a page view as the conversion', () => {
      kit.process(pageView('Account Created'));
      expect(ofType('approved').length).toBe(0);
    });
  });

  describe('gwpApprovedEventName setting', () => {
    it('emits gwpApproved for the configured custom event, with the event attributes as detail', () => {
      const kit = new RoktPayPlusKit();
      kit.init({ gwpApprovedEventName: 'Gift Purchase Completed' });
      kit.process(customEvent('Gift Purchase Completed', { sku: 'gwp-123', amount: '49.99' }));
      const gwp = ofType('gwpApproved');
      expect(gwp.length).toBe(1);
      expect(gwp[0].message.detail).toEqual({ sku: 'gwp-123', amount: '49.99' });
      expect(gwp[0].message.trigger).toBe("logEvent('Gift Purchase Completed')");
      expect(ofType('approved').length).toBe(0);
    });

    it('suppresses the default conversion fallback once gwpApprovedEventName is configured', () => {
      const kit = new RoktPayPlusKit();
      kit.init({ gwpApprovedEventName: 'Gift Purchase Completed' });
      kit.process(customEvent('conversion'));
      expect(ofType('approved').length).toBe(0);
    });
  });

  describe('embedding guard', () => {
    it('makes no postMessage calls when not framed (parent === self)', () => {
      // Restore the real window.parent so the page looks top-level (jsdom: parent === window).
      if (parentDescriptor) {
        Object.defineProperty(window, 'parent', parentDescriptor);
      }
      const spy = vi.spyOn(window, 'postMessage');

      const kit = new RoktPayPlusKit();
      kit.init({});
      kit.process(pageView('signup-email'));
      kit.process(customEvent('conversion'));

      expect(spy).not.toHaveBeenCalled();
      expect(posted.length).toBe(0);
      spy.mockRestore();
    });
  });

  describe('registration', () => {
    it('register() populates config.kits with the constructor', async () => {
      const mod = await import('../../src/RoktPayPlus-Kit');
      const config: { kits?: Record<string, { constructor: new () => RoktPayPlusKit }> } = {};
      mod.register(config);
      expect(config.kits).toBeTruthy();
      expect(typeof config.kits!.RoktPayPlus.constructor).toBe('function');
      const instance = new config.kits!.RoktPayPlus.constructor();
      expect(instance.name).toBe('RoktPayPlus');
    });
  });
});

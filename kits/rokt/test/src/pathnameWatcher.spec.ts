import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { watchPathname } from '../../src/pathnameWatcher';

describe('watchPathname', () => {
  let stop: (() => void) | undefined;
  let seen: string[];

  const flush = (): Promise<void> => Promise.resolve().then(() => undefined);

  beforeEach(() => {
    seen = [];
    window.history.replaceState({}, '', '/start');
  });

  afterEach(() => {
    stop?.();
    stop = undefined;
  });

  it('reports the current pathname on install', () => {
    stop = watchPathname((pathname) => seen.push(pathname));

    expect(seen).toEqual(['/start']);
  });

  it('reports a pushState navigation', async () => {
    stop = watchPathname((pathname) => seen.push(pathname));

    window.history.pushState({}, '', '/checkout/abc/review');
    await flush();

    expect(seen).toEqual(['/start', '/checkout/abc/review']);
  });

  it('reports a replaceState navigation', async () => {
    stop = watchPathname((pathname) => seen.push(pathname));

    window.history.replaceState({}, '', '/checkout/abc/review');
    await flush();

    expect(seen).toEqual(['/start', '/checkout/abc/review']);
  });

  it('reports a popstate navigation', () => {
    stop = watchPathname((pathname) => seen.push(pathname));

    window.history.replaceState({}, '', '/confirmation');
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(seen).toEqual(['/start', '/confirmation']);
  });

  it('does not report the same pathname twice', async () => {
    stop = watchPathname((pathname) => seen.push(pathname));

    window.history.pushState({}, '', '/start?step=2');
    await flush();
    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(seen).toEqual(['/start']);
  });

  it('leaves the history methods as it found them', () => {
    const push = window.history.pushState;
    const replace = window.history.replaceState;

    stop = watchPathname((pathname) => seen.push(pathname));
    expect(window.history.pushState).not.toBe(push);

    stop();
    stop = undefined;

    expect(window.history.pushState).toBe(push);
    expect(window.history.replaceState).toBe(replace);
  });

  it('stops reporting after teardown', async () => {
    stop = watchPathname((pathname) => seen.push(pathname));
    stop();
    stop = undefined;

    window.history.pushState({}, '', '/checkout/abc/review');
    await flush();

    expect(seen).toEqual(['/start']);
  });

  it('still reports pushState navigations made through the original method', async () => {
    const original = window.history.pushState;
    stop = watchPathname((pathname) => seen.push(pathname));

    original.call(window.history, {}, '', '/checkout/abc/review');
    window.dispatchEvent(new PopStateEvent('popstate'));
    await flush();

    expect(seen).toEqual(['/start', '/checkout/abc/review']);
  });

  it('keeps working when History cannot be patched', () => {
    const descriptor = Object.getOwnPropertyDescriptor(window.history, 'pushState');
    Object.defineProperty(window.history, 'pushState', {
      value: window.history.pushState,
      writable: false,
      configurable: true,
    });

    expect(() => {
      stop = watchPathname((pathname) => seen.push(pathname));
    }).not.toThrow();
    expect(seen).toEqual(['/start']);

    stop?.();
    stop = undefined;
    if (descriptor) {
      Object.defineProperty(window.history, 'pushState', descriptor);
    }
  });

  it('passes the pushState arguments through untouched', async () => {
    const spy = vi.spyOn(window.history, 'pushState');
    stop = watchPathname((pathname) => seen.push(pathname));

    window.history.pushState({ a: 1 }, 'title', '/checkout/abc/review');
    await flush();

    expect(window.location.pathname).toBe('/checkout/abc/review');
    spy.mockRestore();
  });
});

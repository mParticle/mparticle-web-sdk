import { describe, it, expect, vi } from 'vitest';
import {
  createLauncherAttachState,
  rememberAttachContext,
  markLauncherAttached,
  markLauncherTerminated,
  markLauncherAttachFailed,
  resetLauncherAttachState,
  recreateIfTerminated,
  type LauncherAttachContext,
} from '../../src/launcherAttachState';

function context(overrides: Partial<LauncherAttachContext> = {}): LauncherAttachContext {
  return {
    accountId: 'acct-1',
    launcherOptions: { sandbox: true },
    legacyRoktExtensions: ['ext-a'],
    ...overrides,
  };
}

describe('launcherAttachState', () => {
  it('starts idle with no context', () => {
    const state = createLauncherAttachState();

    expect(state.lifecycle).toBe('idle');
    expect(state.context).toBeNull();
    expect(state.recreateInFlight).toBeNull();
  });

  it('copies attach context so later mutations do not leak', () => {
    const state = createLauncherAttachState();
    const launcherOptions = { sandbox: true };
    const legacyRoktExtensions = ['ext-a'];

    rememberAttachContext(state, { accountId: 'acct-1', launcherOptions, legacyRoktExtensions });
    launcherOptions.sandbox = false;
    legacyRoktExtensions.push('ext-b');

    expect(state.context).toEqual({
      accountId: 'acct-1',
      launcherOptions: { sandbox: true },
      legacyRoktExtensions: ['ext-a'],
    });
  });

  it('does not treat idle as terminated', () => {
    const state = createLauncherAttachState();

    markLauncherTerminated(state);

    expect(state.lifecycle).toBe('idle');
    expect(recreateIfTerminated(state, true, vi.fn())).toBeUndefined();
  });

  it('recreates once after terminate and coalesces concurrent callers', async () => {
    const state = createLauncherAttachState();
    rememberAttachContext(state, context());
    markLauncherAttached(state);
    markLauncherTerminated(state);

    let resolveAttach: () => void = () => undefined;
    const attach = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveAttach = resolve;
        }),
    );

    const first = recreateIfTerminated(state, true, attach);
    const second = recreateIfTerminated(state, true, attach);

    expect(first).toBeInstanceOf(Promise);
    expect(second).toBe(first);
    expect(attach).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledWith({
      accountId: 'acct-1',
      launcherOptions: { sandbox: true },
      legacyRoktExtensions: ['ext-a'],
    });
    expect(state.lifecycle).toBe('recreating');

    resolveAttach();
    await first;

    expect(state.recreateInFlight).toBeNull();
  });

  it('does not recreate without context or when attach is unavailable', () => {
    const attach = vi.fn();
    const noContext = createLauncherAttachState();
    noContext.lifecycle = 'terminated';

    expect(recreateIfTerminated(noContext, true, attach)).toBeUndefined();

    const blocked = createLauncherAttachState();
    rememberAttachContext(blocked, context());
    markLauncherAttached(blocked);
    markLauncherTerminated(blocked);

    expect(recreateIfTerminated(blocked, false, attach)).toBeUndefined();
    expect(attach).not.toHaveBeenCalled();
  });

  it('can retry after a failed attach', async () => {
    const state = createLauncherAttachState();
    rememberAttachContext(state, context());
    markLauncherAttached(state);
    markLauncherTerminated(state);

    const firstAttach = vi.fn().mockRejectedValue(new Error('createLauncher failed'));
    const failed = recreateIfTerminated(state, true, firstAttach);
    await expect(failed).rejects.toThrow('createLauncher failed');
    markLauncherAttachFailed(state);

    const secondAttach = vi.fn().mockResolvedValue(undefined);
    const retried = recreateIfTerminated(state, true, secondAttach);
    await retried;

    expect(secondAttach).toHaveBeenCalledTimes(1);
  });

  it('resets to idle', () => {
    const state = createLauncherAttachState();
    rememberAttachContext(state, context());
    markLauncherAttached(state);
    markLauncherTerminated(state);

    resetLauncherAttachState(state);

    expect(state).toEqual(createLauncherAttachState());
  });
});

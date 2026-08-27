export type RoktLauncherOptions = Record<string, unknown>;

export interface LauncherAttachContext {
  accountId: string;
  launcherOptions: RoktLauncherOptions;
  legacyRoktExtensions: readonly string[];
}

export type LauncherLifecycle = 'idle' | 'attached' | 'terminated' | 'recreating';

export interface LauncherAttachState {
  context: LauncherAttachContext | null;
  lifecycle: LauncherLifecycle;
  recreateInFlight: Promise<void> | null;
}

export type AttachLauncher = (context: LauncherAttachContext) => Promise<void>;

export function createLauncherAttachState(): LauncherAttachState {
  return {
    context: null,
    lifecycle: 'idle',
    recreateInFlight: null,
  };
}

export function rememberAttachContext(state: LauncherAttachState, context: LauncherAttachContext): void {
  state.context = {
    accountId: context.accountId,
    launcherOptions: { ...context.launcherOptions },
    legacyRoktExtensions: [...context.legacyRoktExtensions],
  };
}

export function markLauncherAttached(state: LauncherAttachState): void {
  state.lifecycle = 'attached';
}

export function markLauncherTerminated(state: LauncherAttachState): void {
  if (state.lifecycle === 'idle') {
    return;
  }
  state.lifecycle = 'terminated';
}

export function markLauncherAttachFailed(state: LauncherAttachState): void {
  state.lifecycle = 'terminated';
}

export function resetLauncherAttachState(state: LauncherAttachState): void {
  state.context = null;
  state.lifecycle = 'idle';
  state.recreateInFlight = null;
}

export function recreateIfTerminated(
  state: LauncherAttachState,
  canAttach: boolean,
  attach: AttachLauncher,
): Promise<void> | undefined {
  if (state.recreateInFlight) {
    return state.recreateInFlight;
  }
  if (state.lifecycle !== 'terminated' || !state.context || !canAttach) {
    return undefined;
  }

  state.lifecycle = 'recreating';
  const context = state.context;
  state.recreateInFlight = attach(context).finally(() => {
    state.recreateInFlight = null;
  });
  return state.recreateInFlight;
}

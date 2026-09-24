// Reports the current pathname and every later change to it, so a caller does not have to
// wait for a page-view event the partner may never send.
export function watchPathname(onChange: (pathname: string) => void): () => void {
  let lastPathname: string | null = null;

  const emit = (): void => {
    const pathname = window.location.pathname;
    if (pathname === lastPathname) {
      return;
    }

    lastPathname = pathname;
    onChange(pathname);
  };

  const originalPushState = window.history.pushState;
  const originalReplaceState = window.history.replaceState;

  // History is patched rather than polled, and the emit is deferred so the site's own
  // navigation handlers run against the new URL before this one does.
  const patch = (original: History['pushState']): History['pushState'] =>
    function patched(this: History, ...args: Parameters<History['pushState']>): void {
      const result = original.apply(this, args);
      Promise.resolve().then(emit);
      return result;
    };

  let patched = false;
  try {
    window.history.pushState = patch(originalPushState);
    window.history.replaceState = patch(originalReplaceState);
    patched = true;
  } catch {
    // A locked-down History leaves the initial read and popstate working.
  }

  window.addEventListener('popstate', emit);
  emit();

  return (): void => {
    if (patched) {
      try {
        window.history.pushState = originalPushState;
        window.history.replaceState = originalReplaceState;
      } catch {
        // Nothing to restore if another patch replaced these in the meantime.
      }
    }

    window.removeEventListener('popstate', emit);
  };
}

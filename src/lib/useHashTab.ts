import { useEffect, useState, useCallback } from 'react';

// Sync a single string state value to window.location.hash so the current tab
// (and any other simple chosen-from-enum state) survives a page reload and is
// shareable via URL. Reads on mount, writes on every change.
export function useHashTab<T extends string>(
  defaultTab: T,
  validValues: readonly T[],
): [T, (t: T) => void] {
  const read = useCallback((): T => {
    const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    return validValues.includes(hash as T) ? (hash as T) : defaultTab;
  }, [defaultTab, validValues]);

  const [tab, setTabState] = useState<T>(() => read());

  // Listen for back/forward navigation — keeps tab state in sync with browser history.
  useEffect(() => {
    const onHashChange = () => setTabState(read());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [read]);

  // Write tab to URL whenever it changes (replaceState avoids growing history).
  useEffect(() => {
    const target = `#/${tab}`;
    if (window.location.hash !== target) {
      window.history.replaceState(null, '', target);
    }
  }, [tab]);

  return [tab, setTabState];
}

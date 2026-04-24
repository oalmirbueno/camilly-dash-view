import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Persistent filter state — hybrid URL + localStorage.
 *
 * Priority on mount: URL search params → localStorage → defaults.
 * Updates are mirrored to BOTH the URL (replaceState) and localStorage,
 * so a refresh keeps the state, and switching routes and coming back also keeps it.
 *
 * Values are stored as strings. Use `"all"` (or any sentinel) for "no filter".
 */
export function usePersistentFilters<T extends Record<string, string>>(
  storageKey: string,
  defaults: T,
) {
  const location = useLocation();
  const navigate = useNavigate();
  const isFirstSync = useRef(true);

  const readInitial = (): T => {
    const params = new URLSearchParams(location.search);
    let fromStorage: Partial<T> = {};
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) fromStorage = JSON.parse(raw) as Partial<T>;
    } catch {
      /* ignore */
    }
    const merged = { ...defaults } as T;
    (Object.keys(defaults) as (keyof T)[]).forEach((k) => {
      const urlVal = params.get(k as string);
      if (urlVal !== null) {
        (merged as Record<string, string>)[k as string] = urlVal;
      } else if (fromStorage[k] !== undefined) {
        (merged as Record<string, string>)[k as string] = fromStorage[k] as string;
      }
    });
    return merged;
  };

  const [filters, setFilters] = useState<T>(readInitial);

  // Sync to URL + localStorage whenever filters change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      /* ignore quota */
    }

    const params = new URLSearchParams(location.search);
    let changed = false;
    (Object.keys(filters) as (keyof T)[]).forEach((k) => {
      const val = filters[k];
      const isDefault = val === defaults[k];
      const current = params.get(k as string);
      if (isDefault) {
        if (current !== null) {
          params.delete(k as string);
          changed = true;
        }
      } else if (current !== val) {
        params.set(k as string, val);
        changed = true;
      }
    });

    if (changed || isFirstSync.current) {
      isFirstSync.current = false;
      const search = params.toString();
      navigate(
        { pathname: location.pathname, search: search ? `?${search}` : "" },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const setFilter = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => {
    setFilters({ ...defaults });
  }, [defaults]);

  const activeKeys = useMemo(
    () =>
      (Object.keys(filters) as (keyof T)[]).filter(
        (k) => filters[k] !== defaults[k] && filters[k] !== "",
      ),
    [filters, defaults],
  );

  return { filters, setFilter, setFilters, reset, activeKeys };
}

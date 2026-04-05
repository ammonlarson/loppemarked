"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A hook that synchronises a piece of React state with the browser's
 * session‑history stack (`history.pushState` / `popstate`).
 *
 * Each state change that should be navigable pushes a new history entry.
 * When the user presses Back/Forward the `popstate` event restores the
 * previous value.
 *
 * @param key    A unique string that identifies this piece of state inside
 *               `history.state` (multiple hooks can coexist).
 * @param initial The initial value (used when no history entry exists).
 */
export function useHistoryState<T>(
  key: string,
  initial: T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    const stored = window.history.state?.[key];
    return stored !== undefined ? (stored as T) : initial;
  });

  // Keep a ref so the popstate listener always sees the latest key without
  // re‑registering.
  const keyRef = useRef(key);
  keyRef.current = key;

  // Guard against pushing during the initial mount or during a popstate
  // handler (which would create duplicate entries).
  const skipNextPush = useRef(true);

  useEffect(() => {
    // After mount, allow subsequent setState calls to push.
    skipNextPush.current = false;
  }, []);

  // Store initial in a ref so the popstate listener doesn't go stale if the
  // consumer passes a derived value (though changes after mount are not
  // expected).
  const initialRef = useRef(initial);

  // Listen for popstate (Back / Forward).
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    function onPopState(event: PopStateEvent) {
      const stored = event.state?.[keyRef.current];
      skipNextPush.current = true;
      setValue(stored !== undefined ? (stored as T) : initialRef.current);
      // If React bails out of the state update (same value), the push-effect
      // won't re-run and skipNextPush would stay true forever.  Clear it on
      // the next macro-task, which fires after React's commit-phase effects.
      timeoutId = setTimeout(() => {
        skipNextPush.current = false;
      }, 0);
    }

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      clearTimeout(timeoutId);
    };
  }, []);

  // Whenever value changes (and the change did NOT come from popstate),
  // push a new history entry.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Seed the current history entry with our initial state so that the
      // very first Back press can restore it.
      try {
        const merged = { ...window.history.state, [key]: value };
        window.history.replaceState(merged, "");
      } catch {
        // SecurityError or DataCloneError — degrade to plain useState.
      }
      return;
    }
    if (skipNextPush.current) {
      skipNextPush.current = false;
      return;
    }
    try {
      const merged = { ...window.history.state, [key]: value };
      window.history.pushState(merged, "");
    } catch {
      // SecurityError or DataCloneError — degrade to plain useState.
    }
  }, [value, key]);

  const set = useCallback((next: T) => {
    setValue(next);
  }, []);

  return [value, set];
}

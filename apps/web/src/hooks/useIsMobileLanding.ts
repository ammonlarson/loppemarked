"use client";

import { useEffect, useState } from "react";

/**
 * Viewport breakpoint at which the landing page swaps from its desktop scene to
 * its dedicated mobile composition. Exported so tests and asset configs stay in
 * sync with the component's switchover point.
 */
export const MOBILE_LANDING_MEDIA_QUERY = "(max-width: 760px)";

/**
 * Tracks whether the viewport currently matches the mobile landing breakpoint.
 *
 * On the server (and during first client paint) this returns `false`, so SSR
 * renders the desktop scene by default. After hydration a matchMedia listener
 * updates the result; narrow viewports flip to the mobile scene on the next
 * render. Kept as a hook (rather than CSS display toggles) so each composition
 * only mounts the DOM and requests the assets it actually needs.
 */
export function useIsMobileLanding(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_LANDING_MEDIA_QUERY);
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  return isMobile;
}

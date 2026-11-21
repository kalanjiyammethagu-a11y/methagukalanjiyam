"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

/**
 * Ensures that every page transition immediately scrolls the mobile and desktop
 * viewport directly to the top (0, 0), eliminating sticky scroll offsets.
 */
export function ScrollToTopOnNavigation() {
  const pathname = usePathname();

  React.useEffect(() => {
    // Immediate scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Fallback for documentElement in mobile Safari / Chrome
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname]);

  return null;
}

// /hooks/useIsMobile.ts
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

type LegacyMQL = MediaQueryList & {
  addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
  removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;
    const mql: LegacyMQL = window.matchMedia(query);

    const onChange = () => setIsMobile(mql.matches);
    onChange(); // estado inicial

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener?.("change", onChange);
    }

    if (typeof mql.addListener === "function") {
      mql.addListener(onChange);
      return () => mql.removeListener?.(onChange);
    }
  }, []);

  return isMobile;
}

import usePrefersReducedMotion from "../hooks/usePrefersReducedMotion";
import { MOTION } from "../utils/motion";
import { Fragment, useEffect, useRef } from "react";
import { isKeyboardNavigation } from "../utils/navigation";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const reducedMotion = usePrefersReducedMotion();
  const { pathname } = useLocation();
  const ref = useRef(null);

  useEffect(() => {
    if (reducedMotion || isKeyboardNavigation() || !ref.current?.animate) return;
    const animation = ref.current.animate([{ opacity: 0.85 }, { opacity: 1 }], {
      duration: MOTION.duration.navigation,
      easing: `cubic-bezier(${MOTION.easing.out.join(",")})`,
    });
    return () => animation.cancel();
  }, [pathname, reducedMotion]);

  return (
    <div
      ref={ref} data-route-content={pathname} tabIndex={-1} className="fl-route-content"
      style={{ height: "100%" }}
    >
      <Fragment key={pathname}>{children}</Fragment>
    </div>
  );
}

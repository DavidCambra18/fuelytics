import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { navigationFocusTarget, navigationPosition, setKeyboardNavigation } from "../utils/navigation";

// One owner for document focus/scroll; async views may grow after navigation.
export default function RouteNavigation() {
  const { pathname, key, hash } = useLocation();
  const type = useNavigationType();
  const previous = useRef({ pathname, key });
  const positions = useRef(new Map());

  useEffect(() => {
    const restoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    const keyboard = () => setKeyboardNavigation(true);
    const pointer = () => setKeyboardNavigation(false);
    document.addEventListener("keydown", keyboard, true);
    document.addEventListener("pointerdown", pointer, true);
    return () => {
      window.history.scrollRestoration = restoration;
      document.removeEventListener("keydown", keyboard, true);
      document.removeEventListener("pointerdown", pointer, true);
    };
  }, []);

  useLayoutEffect(() => {
    const changed = previous.current.key !== key;
    const samePage = previous.current.pathname === pathname;
    previous.current = { pathname, key };
    let pending = changed && (!samePage || type === "POP" || !!hash);
    let focused = false;
    const savedPositions = positions.current;
    const target = navigationPosition(type, savedPositions.get(key));
    const savePosition = () => {
      if (!pending) savedPositions.set(key, { x: window.scrollX, y: window.scrollY });
    };
    const observer = new MutationObserver(() => restore());
    const resize = new ResizeObserver(() => restore());
    const stopRestoring = () => {
      pending = false;
      observer.disconnect();
      resize.disconnect();
      savePosition();
    };
    function restore() {
      if (!pending) return;
      const content = [...document.querySelectorAll("[data-route-content]")].find((node) => node.dataset.routeContent === pathname);
      if (!content) return;
      if (!focused) {
        const focus = navigationFocusTarget(content, document.activeElement, type);
        if (focus) {
          focus.setAttribute("tabindex", "-1");
          focus.focus({ preventScroll: true });
        }
        focused = true;
      }
      let anchor = null;
      try { anchor = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; } catch { /* Invalid fragments use the normal position. */ }
      if (anchor) anchor.scrollIntoView({ behavior: "instant" });
      else window.scrollTo({ left: target.x, top: target.y, behavior: "instant" });
      // If the saved position cannot be reached, retry only as the view grows.
      if (anchor || window.scrollY >= target.y || !content.querySelector('[role="status"]')) stopRestoring();
    }
    const stopOnScrollKey = (event) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) stopRestoring();
    };
    if (pending) {
      observer.observe(document.body, { childList: true, subtree: true });
      resize.observe(document.body);
    }
    window.addEventListener("scroll", savePosition, { passive: true });
    window.addEventListener("wheel", stopRestoring, { passive: true });
    window.addEventListener("touchstart", stopRestoring, { passive: true });
    window.addEventListener("keydown", stopOnScrollKey);
    restore();
    return () => {
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener("scroll", savePosition);
      window.removeEventListener("wheel", stopRestoring);
      window.removeEventListener("touchstart", stopRestoring);
      window.removeEventListener("keydown", stopOnScrollKey);
      if (savedPositions.size > 200) savedPositions.delete(savedPositions.keys().next().value);
    };
  }, [pathname, key, type, hash]);
  return null;
}

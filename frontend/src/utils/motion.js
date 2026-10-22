export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// Milliseconds in CSS; Motion and Leaflet consume seconds at their boundaries.
// Compatibility roles retain today's timings until their own block is approved.
export const MOTION = Object.freeze({
  duration: Object.freeze({
    fast: 140, navigation: 150, feedback: 100, enter: 200, exit: 120,
    page: 240, step: 160, sheet: 240, sheetExit: 160,
  }),
  easing: Object.freeze({
    out: Object.freeze([0.23, 1, 0.32, 1]),
    drawer: Object.freeze([0.32, 0.72, 0, 1]),
    page: Object.freeze([0.22, 1, 0.36, 1]),
    step: "easeOut",
  }),
});

export function prefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function motionSeconds(milliseconds, reducedMotion = false) {
  return reducedMotion ? 0 : milliseconds / 1000;
}

export function mapFlightOptions(duration, reducedMotion = prefersReducedMotion()) {
  return reducedMotion ? { animate: false, duration: 0 } : { animate: true, duration };
}

export function scrollBehavior(reducedMotion = prefersReducedMotion()) {
  return reducedMotion ? "instant" : "smooth";
}

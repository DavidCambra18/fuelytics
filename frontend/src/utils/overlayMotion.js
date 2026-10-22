import { MOTION } from "./motion.js";

export function overlaySpec(kind = "dialog") {
  if (kind === "menu") return { enter: MOTION.duration.fast, exit: MOTION.duration.feedback, from: "translateY(4px) scale(0.98)", easing: MOTION.easing.out };
  if (kind === "sheet") return { enter: MOTION.duration.sheet, exit: MOTION.duration.sheetExit, from: "translateY(100%)", easing: MOTION.easing.drawer };
  return { enter: MOTION.duration.enter, exit: MOTION.duration.exit, from: "scale(0.98)", easing: MOTION.easing.out };
}

// Owns just the animated panel. The blurred backdrop remains static.
export function createOverlayMotion(panel, { kind = "dialog", readStyle = () => getComputedStyle(panel) } = {}) {
  let animation, generation = 0, closing = false, started = false;
  const spec = overlaySpec(kind);
  function cancel() {
    generation++;
    animation?.cancel();
    animation = null;
    closing = false;
  }
  function play(open, immediate, done = () => {}) {
    const interrupted = !!animation;
    const current = interrupted ? readStyle() : null;
    const from = current ? { opacity: current.opacity, transform: current.transform } : open && !started ? { opacity: 0, transform: spec.from } : { opacity: 1, transform: "none" };
    cancel();
    started = true;
    closing = !open;
    const version = generation;
    const finish = () => {
      if (version !== generation) return;
      closing = false;
      done();
    };
    if (immediate || !panel?.animate) { finish(); return; }
    animation = panel.animate([from, open ? { opacity: 1, transform: "none" } : { opacity: 0, transform: spec.from }], {
      duration: open ? spec.enter : spec.exit,
      easing: `cubic-bezier(${spec.easing.join(",")})`, fill: "both",
    });
    animation.finished.then(finish, finish);
  }
  return { play, cancel, isClosing: () => closing };
}

import test from "node:test";
import assert from "node:assert/strict";
import { createOverlayMotion, overlaySpec } from "../src/utils/overlayMotion.js";
import { MOTION } from "../src/utils/motion.js";

function fixture() {
  const animations = [];
  const panel = { animate(frames, options) {
    let resolve, reject;
    const finished = new Promise((yes, no) => { resolve = yes; reject = no; });
    const animation = { finished, frames, options, resolve, reject, cancelled: false, cancel() { this.cancelled = true; reject(new Error("cancelled")); } };
    animations.push(animation);
    return animation;
  } };
  const motion = createOverlayMotion(panel, { readStyle: () => ({ opacity: "0.6", transform: "matrix(0.99, 0, 0, 0.99, 0, 2)" }) });
  return { animations, motion };
}

test("diálogo, menú y panel móvil reutilizan los tiempos y curvas globales", () => {
  assert.deepEqual([overlaySpec().enter, overlaySpec().exit], [200, 120]);
  assert.deepEqual([overlaySpec("menu").enter, overlaySpec("menu").exit], [140, 100]);
  assert.deepEqual([overlaySpec("sheet").enter, overlaySpec("sheet").exit], [240, 160]);
  assert.equal(overlaySpec().easing, MOTION.easing.out);
  assert.equal(overlaySpec("sheet").easing, MOTION.easing.drawer);
  assert.equal(overlaySpec().from, "scale(0.98)");
});

test("la salida mantiene el diálogo activo hasta finalizar; solo anima opacidad y transform", async () => {
  const { motion, animations } = fixture();
  let closed = 0;
  motion.play(true, false);
  motion.play(false, false, () => closed++);
  assert.equal(closed, 0);
  assert.equal(motion.isClosing(), true);
  const exit = animations.at(-1);
  assert.equal(exit.options.duration, 120);
  for (const frame of exit.frames) assert.deepEqual(Object.keys(frame).sort(), ["opacity", "transform"]);
  exit.resolve();
  await exit.finished;
  assert.equal(closed, 1);
  assert.equal(motion.isClosing(), false);
});

test("reabrir durante la salida continúa desde el estado visible e invalida el cierre antiguo", async () => {
  const { motion, animations } = fixture();
  let closed = false;
  motion.play(true, false);
  motion.play(false, false, () => { closed = true; });
  motion.play(true, false);
  assert.equal(animations[1].cancelled, true);
  assert.equal(animations[2].frames[0].opacity, "0.6");
  await Promise.resolve();
  animations[2].resolve();
  await animations[2].finished;
  assert.equal(closed, false);
});

test("desmontar cancela la salida y nunca ejecuta una devolución de llamada tardía", async () => {
  const { motion, animations } = fixture();
  let closed = false;
  motion.play(false, false, () => { closed = true; });
  motion.cancel();
  await Promise.resolve();
  assert.equal(animations[0].cancelled, true);
  assert.equal(closed, false);
});

test("teclado, movimiento reducido y ausencia de WAAPI cierran inmediatamente", () => {
  const { motion, animations } = fixture();
  let closed = 0;
  motion.play(false, true, () => closed++);
  assert.equal(closed, 1);
  assert.equal(animations.length, 0);
  createOverlayMotion({}).play(false, false, () => closed++);
  assert.equal(closed, 2);
});

test("la cancelación externa de la salida no deja un overlay invisible bloqueado", async () => {
  const { motion, animations } = fixture();
  let closed = false;
  motion.play(false, false, () => { closed = true; });
  animations[0].cancel();
  await Promise.resolve();
  assert.equal(closed, true);
  assert.equal(motion.isClosing(), false);
});

test("activar movimiento reducido durante la salida finaliza una sola vez e invalida la animación", async () => {
  const { motion, animations } = fixture();
  let closed = 0;
  motion.play(false, false, () => closed++);
  motion.play(false, true, () => closed++);
  await Promise.resolve();
  assert.equal(closed, 1);
  assert.equal(animations[0].cancelled, true);
  assert.equal(motion.isClosing(), false);
});

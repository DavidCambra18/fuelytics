import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { MOTION, REDUCED_MOTION_QUERY, prefersReducedMotion, motionSeconds, mapFlightOptions, scrollBehavior } from "../src/utils/motion.js";

const css = readFileSync(new URL("../src/index.css", import.meta.url), "utf8");

test("CSS y Motion comparten duraciones y curvas sin confundir milisegundos y segundos", () => {
  for (const [role, milliseconds] of Object.entries(MOTION.duration)) {
    const variable = role.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const match = css.match(new RegExp(`--motion-${variable}:\\s*([0-9]+)ms`));
    assert.ok(match, `Falta el token CSS ${variable}`);
    assert.equal(Number(match[1]), milliseconds);
    assert.equal(motionSeconds(milliseconds), milliseconds / 1000);
    assert.equal(motionSeconds(milliseconds, true), 0);
  }
  for (const role of ["out", "drawer", "page"]) {
    const match = css.match(new RegExp(`--ease-${role}:\\s*cubic-bezier\\(([^)]+)\\)`));
    assert.ok(match, `Falta la curva CSS ${role}`);
    assert.deepEqual(match[1].split(",").map(Number), [...MOTION.easing[role]]);
  }
  assert.match(css, /--ease-step:\s*ease-out/);
  assert.equal(MOTION.easing.step, "easeOut");
});

test("los vuelos conservan sus tiempos normales y son inmediatos con movimiento reducido", () => {
  for (const duration of [0.45, 0.5]) {
    assert.deepEqual(mapFlightOptions(duration, false), { animate: true, duration });
    assert.deepEqual(mapFlightOptions(duration, true), { animate: false, duration: 0 });
  }
});

test("el scroll reducido es instantáneo aunque un ancestro utilice scroll suave", () => {
  assert.equal(scrollBehavior(false), "smooth");
  assert.equal(scrollBehavior(true), "instant");
});

test("mapa y scroll leen la preferencia actual en cada acción, sin recargar", (t) => {
  let reduced = false;
  const previous = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {
    matchMedia: (query) => { assert.equal(query, REDUCED_MOTION_QUERY); return { matches: reduced }; },
  } });
  t.after(() => { if (previous) Object.defineProperty(globalThis, "window", previous); else delete globalThis.window; });
  assert.equal(prefersReducedMotion(), false);
  assert.deepEqual(mapFlightOptions(0.5), { animate: true, duration: 0.5 });
  reduced = true;
  assert.equal(prefersReducedMotion(), true);
  assert.deepEqual(mapFlightOptions(0.5), { animate: false, duration: 0 });
  assert.equal(scrollBehavior(), "instant");
  reduced = false;
  assert.equal(scrollBehavior(), "smooth");
});

test("la política puede leerse sin navegador", () => {
  assert.equal(prefersReducedMotion(), false);
});

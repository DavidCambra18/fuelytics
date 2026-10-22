import test from "node:test";
import assert from "node:assert/strict";
import { activateModal } from "../src/utils/modalScope.js";

function environment(t) {
  const root = { inert: false, contains: () => false };
  const one = {}, two = {};
  const first = { inert: false, contains: (node) => node === one };
  const second = { inert: false, contains: (node) => node === two };
  const body = { style: { overflow: "auto" }, children: [root, first, second] };
  let changed;
  const originals = ["document", "MutationObserver"].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]);
  Object.defineProperty(globalThis, "document", { configurable: true, value: { body } });
  Object.defineProperty(globalThis, "MutationObserver", { configurable: true, value: class { constructor(callback) { changed = callback; } observe() {} disconnect() {} } });
  t.after(() => { for (const [name, value] of originals) { if (value) Object.defineProperty(globalThis, name, value); else delete globalThis[name]; } });
  return { root, one, two, first, second, body, changed: () => changed() };
}

test("la protección modal conserva el fondo inerte y scroll bloqueado hasta liberar el ámbito", (t) => {
  const { root, one, first, body } = environment(t);
  const scope = activateModal(one);
  assert.equal(root.inert, true);
  assert.equal(first.inert, false);
  assert.equal(body.style.overflow, "hidden");
  assert.equal(scope.isTop(), true);
  scope.release();
  scope.release();
  assert.equal(root.inert, false);
  assert.equal(body.style.overflow, "auto");
});

test("solo el modal superior está disponible y desmontar fuera de orden no libera el fondo", (t) => {
  const { root, one, two, first, second, body } = environment(t);
  const a = activateModal(one), b = activateModal(two);
  assert.equal(a.isTop(), false);
  assert.equal(b.isTop(), true);
  assert.equal(first.inert, true);
  assert.equal(second.inert, false);
  a.release();
  assert.equal(root.inert, true);
  assert.equal(body.style.overflow, "hidden");
  b.release();
  assert.equal(root.inert, false);
  assert.equal(first.inert, false);
  assert.equal(second.inert, false);
  assert.equal(body.style.overflow, "auto");
});

test("los portales nuevos quedan protegidos y se conservan los valores inert previos", (t) => {
  const { root, one, body, changed } = environment(t);
  root.inert = true;
  const scope = activateModal(one);
  const portal = { inert: false, contains: () => false };
  body.children.push(portal);
  changed();
  assert.equal(portal.inert, true);
  scope.release();
  assert.equal(root.inert, true);
  assert.equal(portal.inert, false);
});

test("cerrar un diálogo anidado devuelve la protección al anterior sin desbloquear el scroll", (t) => {
  const { root, one, two, first, second, body } = environment(t);
  const outer = activateModal(one), inner = activateModal(two);
  inner.release();
  assert.equal(outer.isTop(), true);
  assert.equal(root.inert, true);
  assert.equal(first.inert, false);
  assert.equal(second.inert, true);
  assert.equal(body.style.overflow, "hidden");
  outer.release();
  assert.equal(body.style.overflow, "auto");
});

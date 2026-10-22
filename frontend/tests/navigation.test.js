import test from "node:test";
import assert from "node:assert/strict";
import { navigationFocusTarget, navigationPosition, isKeyboardNavigation, setKeyboardNavigation } from "../src/utils/navigation.js";
import { loadRequest } from "../src/utils/loadRequest.js";

test("el historial restaura la posición de cada entrada; PUSH y REPLACE empiezan arriba", () => {
  const saved = { x: 0, y: 730 };
  assert.deepEqual(navigationPosition("POP", saved), saved);
  assert.deepEqual(navigationPosition("POP"), { x: 0, y: 0 });
  for (const type of ["PUSH", "REPLACE"]) assert.deepEqual(navigationPosition(type, saved), { x: 0, y: 0 });
});

test("las pestañas persistentes conservan el foco; historial y enlaces desmontados enfocan el destino", () => {
  const heading = {};
  const content = { querySelector: () => heading };
  const link = { isConnected: true, matches: () => true };
  assert.equal(navigationFocusTarget(content, link, "PUSH"), null);
  assert.equal(navigationFocusTarget(content, link, "POP"), heading);
  assert.equal(navigationFocusTarget(content, { ...link, isConnected: false }, "PUSH"), heading);
  const empty = { querySelector: () => null };
  assert.equal(navigationFocusTarget(empty, null, "PUSH"), empty);
});

test("la modalidad de entrada distingue teclado de puntero para la transición", () => {
  setKeyboardNavigation(true);
  assert.equal(isKeyboardNavigation(), true);
  setKeyboardNavigation(false);
  assert.equal(isKeyboardNavigation(), false);
});

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

test("StrictMode: la limpieza de la primera petición no retira la carga de la segunda", async () => {
  const old = new AbortController();
  const current = new AbortController();
  const first = deferred();
  const second = deferred();
  const published = [];
  const callbacks = { onSuccess: (data) => published.push(data), onError: (error) => published.push(error), onSettled: () => published.push("loaded") };
  const one = loadRequest({ signal: old.signal, load: () => first.promise, ...callbacks });
  old.abort();
  const two = loadRequest({ signal: current.signal, load: () => second.promise, ...callbacks });
  first.reject(Object.assign(new Error("cancelled"), { name: "AbortError" }));
  await one;
  assert.deepEqual(published, []);
  second.resolve(["current"]);
  await two;
  assert.deepEqual(published, [["current"], "loaded"]);
});

test("una respuesta antigua que ignora abortar o termina de decodificar no publica datos", async () => {
  const controller = new AbortController();
  const decoding = deferred();
  const publications = [];
  const pending = loadRequest({ signal: controller.signal, load: () => decoding.promise, onSuccess: (data) => publications.push(data), onError: (error) => publications.push(error), onSettled: () => publications.push("loaded") });
  controller.abort();
  decoding.resolve(["old vehicle"]);
  await pending;
  assert.deepEqual(publications, []);
});

test("error y vacío son estados distintos; un error tardío cancelado tampoco se publica", async () => {
  const events = [];
  const callbacks = { onSuccess: (data) => events.push(data), onError: (error) => events.push(error.message), onSettled: () => events.push("loaded") };
  await loadRequest({ signal: new AbortController().signal, load: async () => [], ...callbacks });
  assert.deepEqual(events, [[], "loaded"]);
  events.length = 0;
  await loadRequest({ signal: new AbortController().signal, load: async () => { throw new Error("offline"); }, ...callbacks });
  assert.deepEqual(events, ["offline", "loaded"]);
  events.length = 0;
  const controller = new AbortController();
  const response = deferred();
  const pending = loadRequest({ signal: controller.signal, load: () => response.promise, ...callbacks });
  controller.abort();
  response.reject(new Error("late server failure"));
  await pending;
  assert.deepEqual(events, []);
});

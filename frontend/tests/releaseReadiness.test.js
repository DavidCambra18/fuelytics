import { Buffer } from "node:buffer";
import process from "node:process";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { localDate } from "../src/utils/localDate.js";
import { tripEstimate } from "../src/utils/tripEstimate.js";
import { getPageNumbers } from "../src/utils/pagination.js";
import { getQuantityUnit, getOdometerUnit } from "../src/utils/vehicleLabels.js";
import { discardExpiredStoredAuth, observeStoredAuth, readStoredAuth, sessionIdentity } from "../src/utils/authStorage.js";

const token = (name) => `header.${Buffer.from(JSON.stringify({ name, exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
function storage() {
  const values = new Map();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key), clear: () => values.clear() };
}

test("fecha local a medianoche en España conserva el día y funciona en cambios de año", () => {
  const previous = process.env.TZ;
  try {
    process.env.TZ = "Europe/Madrid";
    assert.equal(localDate(new Date("2026-10-25T00:30:00+02:00")), "2026-10-25");
    assert.equal(localDate(new Date("2027-01-01T00:30:00+01:00")), "2027-01-01");
    assert.equal(localDate(new Date("2026-03-29T03:30:00+02:00")), "2026-03-29");
  } finally { if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous; }
});

test("calculadora conserva las fórmulas y rechaza negativos, fracciones de persona y valores no finitos", () => {
  const values = { distance: "450", consumption: "6.5", fuelPrice: "1.659", people: "3" };
  const result = tripEstimate(values);
  assert.equal(result.valid, true);
  assert.equal(result.estimatedLiters, 29.25);
  assert.equal(result.totalCost, 29.25 * 1.659);
  assert.equal(result.costPerPerson, result.totalCost / 3);
  for (const [field, bad] of [["distance", "-1"], ["consumption", "-1"], ["fuelPrice", "Infinity"], ["people", "0"], ["people", "1.5"], ["people", "-1"]]) {
    const invalid = tripEstimate({ ...values, [field]: bad });
    assert.equal(invalid.valid, false);
    assert.ok(invalid.errors[field]);
    assert.equal(invalid.totalCost, null);
  }
  assert.equal(tripEstimate({ ...values, distance: "" }).totalCost, null);
  assert.equal(tripEstimate({ ...values, distance: "0" }).totalCost, 0);
});

test("paginación de historiales grandes mantiene controles acotados y las páginas extremas", () => {
  assert.deepEqual(getPageNumbers(1, 1), [1]);
  const numbers = getPageNumbers(10000, 5000);
  assert.equal(numbers.length, 7);
  assert.deepEqual(numbers, [1, 4998, 4999, 5000, 5001, 5002, 10000]);
});

test("unidades de energía y trabajo mantienen litros, kg, kWh, km y horas", () => {
  assert.equal(getQuantityUnit("electric"), "kWh"); assert.equal(getQuantityUnit("gnc"), "kg");
  assert.equal(getQuantityUnit("hydrogen"), "kg"); assert.equal(getQuantityUnit("diesel"), "L");
  assert.equal(getOdometerUnit("agricultural"), "h"); assert.equal(getOdometerUnit("car"), "km");
});

test("la sesión se sincroniza entre pestañas al entrar, salir y vaciar almacenamiento sin reescribirlo", () => {
  const local = storage(), target = new EventTarget(), received = [];
  const unsubscribe = observeStoredAuth(target, local, (auth) => received.push(auth));
  const dispatch = (key, area = local) => target.dispatchEvent(Object.assign(new Event("storage"), { key, storageArea: area }));
  const currentToken = token("new"); local.setItem("token", currentToken); local.setItem("username", "new");
  dispatch("token"); assert.deepEqual(received.at(-1), { token: currentToken, username: "new" });
  local.removeItem("token"); dispatch("token"); assert.deepEqual(received.at(-1), { token: "", username: "" });
  local.setItem("token", "expired"); dispatch("token"); assert.equal(readStoredAuth(local).token, "");
  local.clear(); dispatch(null); assert.deepEqual(received.at(-1), { token: "", username: "" });
  const count = received.length; dispatch("sidebar"); dispatch("token", storage()); unsubscribe(); dispatch("token");
  assert.equal(received.length, count);
});

test("apiFetch no expulsa la sesión nueva por un 401 antiguo y sí invalida un token actual rechazado", async () => {
  const source = (await readFile(new URL("../src/services/api.js", import.meta.url), "utf8")).replace('import { API_BASE } from "../config/api";', 'const API_BASE = "";');
  const { apiFetch } = await import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
  const previous = { localStorage: globalThis.localStorage, window: globalThis.window, fetch: globalThis.fetch };
  try {
    globalThis.localStorage = storage(); globalThis.window = new EventTarget();
    let unauthorized = 0, finish;
    window.addEventListener("fuelytics:unauthorized", () => unauthorized++);
    globalThis.fetch = async () => new Promise((resolve) => { finish = resolve; });
    localStorage.setItem("token", "old");
    const pending = apiFetch("/api/vehicles"); localStorage.setItem("token", "new");
    finish(new Response(null, { status: 401 })); await pending;
    assert.equal(localStorage.getItem("token"), "new"); assert.equal(unauthorized, 0);
    const rejected = apiFetch("/api/vehicles"); finish(new Response(null, { status: 401 })); await rejected;
    assert.equal(localStorage.getItem("token"), null); assert.equal(unauthorized, 1);
    const anonymous = apiFetch("/api/login"); localStorage.setItem("token", "fresh"); finish(new Response(null, { status: 401 })); await anonymous;
    assert.equal(localStorage.getItem("token"), "fresh"); assert.equal(unauthorized, 1);
  } finally {
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});

test("cambiar de cuenta reinicia el contexto privado y renovar su token conserva la identidad", () => {
  const jwt = (claims) => `header.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.signature`;
  const first = jwt({ sub: "one@example.com", userId: 1, exp: 100 });
  const renewed = jwt({ sub: "one@example.com", userId: 1, exp: 200 });
  const other = jwt({ sub: "two@example.com", userId: 2, exp: 200 });
  assert.equal(sessionIdentity(first), sessionIdentity(renewed));
  assert.notEqual(sessionIdentity(first), sessionIdentity(other));
});

test("el arranque retira credenciales caducadas sin sobrescribir una sesión válida", () => {
  const local = storage(); local.setItem("token", "expired"); local.setItem("username", "old");
  discardExpiredStoredAuth(local);
  assert.equal(local.getItem("token"), null); assert.equal(local.getItem("username"), null);
  const valid = token("current"); local.setItem("token", valid); local.setItem("username", "current");
  discardExpiredStoredAuth(local);
  assert.equal(local.getItem("token"), valid); assert.equal(local.getItem("username"), "current");
});

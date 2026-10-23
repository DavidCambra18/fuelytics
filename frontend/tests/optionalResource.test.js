import test from "node:test";
import assert from "node:assert/strict";
import { optionalResource } from "../src/utils/optionalResource.js";

const options = { fallback: [], message: "No disponible" };
const response = (data, status = 200) => new Response(JSON.stringify(data), { status });

test("una colección vacía confirmada no es un fallo de carga", async () => {
  assert.deepEqual(await optionalResource(Promise.resolve(response([])), options), { data: [], error: "" });
});

test("los fallos HTTP, de red o de decodificación no se anuncian como ausencia de registros", async () => {
  for (const request of [Promise.resolve(response({}, 503)), Promise.reject(new TypeError("offline")), Promise.resolve(new Response("invalid JSON"))]) {
    assert.deepEqual(await optionalResource(request, options), { data: [], error: "No disponible" });
  }
});

test("un fallo parcial conserva las otras secciones y el valor nulo válido de estadísticas", async () => {
  const [rows, stats, unavailable] = await Promise.all([
    optionalResource(Promise.resolve(response([{ id: 1 }])), options),
    optionalResource(Promise.resolve(response(null)), { ...options, fallback: null }),
    optionalResource(Promise.resolve(response({}, 403)), options),
  ]);
  assert.deepEqual(rows, { data: [{ id: 1 }], error: "" });
  assert.deepEqual(stats, { data: null, error: "" });
  assert.equal(unavailable.error, "No disponible");
});

test("abandonar la vista durante la decodificación invalida datos y errores tardíos", async () => {
  for (const fails of [false, true]) {
    const controller = new AbortController();
    let settle;
    const decoding = new Promise((resolve, reject) => { settle = () => fails ? reject(new Error("late")) : resolve([1]); });
    const pending = optionalResource(Promise.resolve({ ok: true, json: () => decoding }), { ...options, signal: controller.signal });
    await Promise.resolve();
    controller.abort();
    settle();
    assert.equal(await pending, null);
  }
});

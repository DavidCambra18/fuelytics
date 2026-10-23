import test from "node:test";
import assert from "node:assert/strict";
import { popupPanOffset, fitPopupImmediately, syncPopupMotion } from "../src/utils/mapPopup.js";

const mapBounds = { left: 100, right: 600, top: 200, bottom: 700 };
test("una ficha dentro del espacio disponible no mueve el mapa", () => {
  assert.deepEqual(popupPanOffset(mapBounds, { left: 180, right: 440, top: 330, bottom: 660 }), [0, 0]);
});
test("el ajuste reserva espacio al zoom y la leyenda sin cambiar coordenadas de la estación", () => {
  assert.deepEqual(popupPanOffset(mapBounds, { left: 90, right: 350, top: 210, bottom: 540 }), [-15, -100]);
  assert.deepEqual(popupPanOffset(mapBounds, { left: 400, right: 660, top: 410, bottom: 740 }), [65, 52]);
});
test("el encuadre reducido cancela el pan implícito y solo utiliza panBy sin animación", () => {
  const calls = [];
  const map = { stop: () => calls.push("stop"), getContainer: () => ({ getBoundingClientRect: () => mapBounds }), panBy: (...args) => calls.push(args) };
  fitPopupImmediately(map, { getElement: () => ({ getBoundingClientRect: () => ({ left: 90, right: 350, top: 210, bottom: 540 }) }) });
  assert.deepEqual(calls, ["stop", [[-15, -100], { animate: false }]]);
  fitPopupImmediately(map, { getElement: () => null });
  assert.equal(calls.length, 2);
});

test("el popup reducido desactiva el pan nativo antes de actualizar su contenido", () => {
  const calls = [];
  const popup = { options: { autoPan: true }, update() { calls.push(this.options.autoPan); }, getElement: () => null };
  const map = { getSize: () => ({ y: 500 }) };
  syncPopupMotion(map, popup, true, true);
  assert.deepEqual(calls, [false]);
  assert.equal(popup.options.maxHeight, 368);
});

test("la preferencia normal se restaura sin actualizaciones redundantes", () => {
  let updates = 0;
  const popup = { options: { autoPan: false }, update: () => updates++ };
  syncPopupMotion({}, popup, false);
  syncPopupMotion({}, popup, false);
  assert.equal(popup.options.autoPan, true);
  assert.equal(updates, 1);
});

test("el redimensionado mantiene un alto mínimo legible", () => {
  const popup = { options: { autoPan: true }, update() {} };
  syncPopupMotion({ getSize: () => ({ y: 250 }) }, popup, false, true);
  assert.equal(popup.options.maxHeight, 160);
});

import test from "node:test";
import assert from "node:assert/strict";
import { getTourStatus, setTourStatus, queueWelcomeTour, placeTourPanel } from "../src/utils/onboarding.js";

const makeStorage = () => {
  const data = new Map();
  return { getItem: (key) => data.get(key) || null, setItem: (key, value) => data.set(key, value), data };
};

test("una cuenta existente sin marca no recibe el tour automáticamente", () => {
  assert.equal(getTourStatus("CuentaExistente", makeStorage()), null);
});

test("la marca pendiente corresponde al nuevo usuario y no a otra cuenta", () => {
  const storage = makeStorage();
  setTourStatus("CuentaNueva", "pending", storage);
  assert.equal(getTourStatus("cuentanueva", storage), "pending");
  assert.equal(getTourStatus("OtraCuenta", storage), null);
  assert.deepEqual([...storage.data.values()], ["pending"]);
});

test("terminar u omitir persiste la elección; un nuevo registro puede reactivarla", () => {
  const storage = makeStorage();
  setTourStatus("CuentaFinalizada", "completed", storage);
  assert.equal(getTourStatus("CuentaFinalizada", storage), "completed");
  setTourStatus("CuentaOmitida", "skipped", storage);
  assert.equal(getTourStatus("CuentaOmitida", storage), "skipped");
  queueWelcomeTour("CuentaFinalizada");
  assert.equal(getTourStatus("CuentaFinalizada", storage), "pending");
});

test("un navegador que bloquea el almacenamiento no rompe el registro ni el recorrido", () => {
  const blocked = { getItem() { throw new Error("Blocked"); }, setItem() { throw new Error("Blocked"); } };
  assert.equal(getTourStatus("NuncaRegistrada", blocked), null);
  assert.doesNotThrow(() => setTourStatus("MemoriaTemporal", "pending", blocked));
  assert.equal(getTourStatus("MemoriaTemporal", blocked), "pending");
  setTourStatus("MemoriaTemporal", "skipped", blocked);
  assert.equal(getTourStatus("MemoriaTemporal", blocked), "skipped");
});

test("un identificador ausente o un estado desconocido no escribe preferencias", () => {
  const storage = makeStorage();
  setTourStatus("", "pending", storage);
  setTourStatus(null, "pending", storage);
  setTourStatus("Valida", "unexpected", storage);
  assert.equal(storage.data.size, 0);
  assert.equal(getTourStatus(undefined, storage), null);
});

test("el panel permanece dentro de escritorio, tablet y móvil, incluso con contenido largo", () => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    for (const height of [568, 850]) {
      for (const panelHeight of [300, 1000]) {
        for (const target of [null, { left: 12, right: 68, top: 100, bottom: 150, width: 56, height: 50 }, { left: width - 72, right: width - 12, top: height - 80, bottom: height - 20, width: 60, height: 60 }]) {
          const position = placeTourPanel(target, { height: panelHeight }, { width, height });
          assert.ok(position.left >= 12);
          assert.ok(position.left + position.width <= width - 12);
          assert.ok(position.top >= 12);
          assert.ok(position.top + Math.min(panelHeight, height - 24) <= height - 12);
        }
      }
    }
  }
});

test("el panel se coloca junto al menú lateral y por encima de la navegación móvil", () => {
  const sidebar = { left: 12, right: 68, top: 200, bottom: 250, width: 56, height: 50 };
  const beside = placeTourPanel(sidebar, { height: 300 }, { width: 1440, height: 900 });
  assert.ok(beside.left > sidebar.right);
  const mobile = { left: 290, right: 350, top: 760, bottom: 820, width: 60, height: 60 };
  const above = placeTourPanel(mobile, { height: 300 }, { width: 390, height: 850 });
  assert.ok(above.top + 300 < mobile.top);
});

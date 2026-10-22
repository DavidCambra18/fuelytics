import test from "node:test";
import assert from "node:assert/strict";
import { createActionGate } from "../src/utils/actionGate.js";
import { expireNotice } from "../src/utils/noticeLifecycle.js";
import { noticeMotion, registrationStepMotion } from "../src/utils/feedbackMotion.js";

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

test("dos envíos en el mismo turno producen una sola escritura y ningún éxito anticipado", async () => {
  const gate = createActionGate(), response = deferred();
  let writes = 0, successes = 0, prevented = 0;
  const submit = gate.guard(async () => { writes++; await response.promise; successes++; });
  const event = { preventDefault: () => prevented++ };
  const first = submit(event), duplicate = submit(event);
  assert.equal(writes, 1);
  assert.equal(successes, 0);
  response.resolve();
  await Promise.all([first, duplicate]);
  assert.equal(successes, 1);
  assert.equal(prevented, 2);
});

test("una validación fallida o un error de red liberan el bloqueo para reintentar", async () => {
  const gate = createActionGate();
  let valid = false, writes = 0;
  const submit = gate.guard(async () => { if (!valid) return; writes++; throw new Error("offline"); });
  await submit();
  assert.equal(writes, 0);
  valid = true;
  await assert.rejects(submit(), /offline/);
  await assert.rejects(submit(), /offline/);
  assert.equal(writes, 2);
});

test("una confirmación cancelada no escribe y una confirmación pendiente no se duplica", async () => {
  const gate = createActionGate(), response = deferred();
  let accepted = false, confirmations = 0, writes = 0;
  const remove = gate.guard(async () => { confirmations++; if (!accepted) return; writes++; await response.promise; });
  await remove();
  accepted = true;
  const active = remove();
  await remove();
  assert.equal(confirmations, 2);
  assert.equal(writes, 1);
  response.resolve();
  await active;
});

test("una respuesta de una pantalla desmontada no confirma ni navega en la pantalla nueva", async () => {
  const gate = createActionGate(), response = deferred();
  const published = [];
  const pending = gate.guard(async () => { await response.promise; if (gate.isActive()) published.push("saved and navigate"); })();
  gate.dispose();
  response.resolve();
  await pending;
  await gate.guard(() => published.push("new request"))();
  assert.deepEqual(published, []);
});

test("un error parcial se anuncia inmediatamente y las escrituras restantes siguen bloqueadas", async () => {
  const gate = createActionGate(), remaining = deferred();
  const events = [];
  const save = gate.guard(async () => {
    const writes = [Promise.reject(new Error("failed")), remaining.promise];
    try { await Promise.all(writes); events.push("success"); }
    catch { events.push("error"); }
    finally { await Promise.allSettled(writes); }
  });
  const pending = save();
  await Promise.resolve(); await Promise.resolve();
  await gate.guard(() => events.push("duplicate"))();
  assert.deepEqual(events, ["error"]);
  remaining.resolve();
  await pending;
});

test("el temporizador antiguo no borra el aviso nuevo, ni siquiera si ya estaba encolado", () => {
  const first = { id: 1, message: "first" }, second = { id: 2, message: "second" };
  assert.equal(expireNotice(second, first.id), second);
  assert.equal(expireNotice(second, second.id), null);
  assert.equal(expireNotice(null, first.id), null);
});

test("el registro utiliza 80/140 ms y respeta la dirección sin animar layout", () => {
  const motion = registrationStepMotion();
  assert.equal(motion.visible.transition.duration, 0.14);
  for (const direction of [-1, 1]) {
    assert.equal(motion.enter(direction).transform, `translateX(${direction * 6}px)`);
    assert.equal(motion.exit(direction).transform, `translateX(${direction * -4}px)`);
    assert.equal(motion.exit(direction).transition.duration, 0.08);
    assert.deepEqual(Object.keys(motion.enter(direction)).sort(), ["opacity", "transform"]);
  }
});

test("avisos suaves 180/120 ms, errores y movimiento reducido inmediatos", () => {
  const normal = noticeMotion(false), instant = noticeMotion(true);
  assert.equal(normal.animate.transition.duration, 0.18);
  assert.equal(normal.exit.transition.duration, 0.12);
  assert.equal(normal.initial.transform, "translateY(-6px)");
  assert.equal(instant.animate.transition.duration, 0);
  assert.equal(instant.exit.transition.duration, 0);
  assert.equal(instant.initial.opacity, 1);
  assert.equal(instant.initial.transform, "none");
});

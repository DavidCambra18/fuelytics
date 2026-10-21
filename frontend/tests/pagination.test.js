import test from "node:test";
import assert from "node:assert/strict";
import { getPagination } from "../src/utils/pagination.js";

test("al borrar el único elemento de la última página se recupera la anterior", () => {
  assert.deepEqual(getPagination(16, 15, 2), { page: 2, totalPages: 2, startIndex: 15 });
  const afterDeletion = getPagination(15, 15, 2);
  assert.deepEqual(afterDeletion, { page: 1, totalPages: 1, startIndex: 0 });
  const remaining = Array.from({ length: 15 }, (_, id) => id);
  assert.equal(remaining.slice(afterDeletion.startIndex, afterDeletion.startIndex + 15).length, 15);
});

test("un historial vacío conserva una página válida sin índices negativos", () => {
  assert.deepEqual(getPagination(0, 15, 3), { page: 1, totalPages: 1, startIndex: 0 });
  assert.deepEqual(getPagination(15, 15, 0), { page: 1, totalPages: 1, startIndex: 0 });
});

test("el ajuste conserva la página actual mientras siga existiendo", () => {
  assert.deepEqual(getPagination(31, 15, 2), { page: 2, totalPages: 3, startIndex: 15 });
  assert.deepEqual(getPagination(30, 15, 3), { page: 2, totalPages: 2, startIndex: 15 });
  assert.deepEqual(getPagination(16, 15, 1), { page: 1, totalPages: 2, startIndex: 0 });
});

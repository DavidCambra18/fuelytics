import test from "node:test";
import assert from "node:assert/strict";
import { normalizeRegistration, validateRegistration, validateUsername, validateEmail, validatePassword } from "../src/utils/registrationValidation.js";

test("el usuario exige 3–15 caracteres y el formato permitido por el backend", () => {
  for (const value of ["abc", "Usuario_18.test", "User_18.test-"]) assert.equal(validateUsername(value), "");
  for (const value of ["", "ab", "a".repeat(16), "José", "dos nombres", "<user>"]) assert.ok(validateUsername(value), value);
});

test("el correo respeta el máximo de 50 caracteres y rechaza formatos incompletos", () => {
  for (const value of ["user+tag@example.com", "a".repeat(44) + "@b.com"]) assert.equal(validateEmail(value), "");
  for (const value of ["", "user@", "a@@b.com", "a..b@example.com", ".a@example.com", "a.@example.com", "a@-example.com", "a@exa mple.com", "a".repeat(45) + "@b.com"]) assert.ok(validateEmail(value), value);
});

test("la contraseña respeta el mínimo de 8 y el máximo de 72 bytes sin recortarla", () => {
  for (const value of ["12345678", "a".repeat(72), "é".repeat(36), "🚗".repeat(18), "  clave  "]) assert.equal(validatePassword(value), "");
  for (const value of ["", "        ", "1234567", "a".repeat(73), "é".repeat(37), "🚗".repeat(19)]) assert.ok(validatePassword(value), value);
});

test("se normalizan identidad y nombres, conservando exactamente la contraseña", () => {
  const body = normalizeRegistration({ username: " Usuario ", email: " NEW@EXAMPLE.COM ", password: "  clave  ", firstName: " María ", lastName: " García " });
  assert.deepEqual(body, { username: "Usuario", email: "new@example.com", password: "  clave  ", firstName: "María", lastName: "García" });
  assert.ok(Object.values(validateRegistration(body, "  clave  ")).every((error) => !error));
  assert.ok(validateRegistration(body, "clave").confirmPassword);
});

test("se rechazan campos vacíos y nombres que superan el máximo del backend", () => {
  const empty = validateRegistration({ username: "", email: "", password: "", firstName: "", lastName: "" }, "");
  for (const field of ["username", "email", "password", "confirmPassword"]) assert.ok(empty[field]);
  const values = { username: "user", email: "a@b.com", password: "12345678", firstName: "a".repeat(100), lastName: "b".repeat(100) };
  assert.ok(Object.values(validateRegistration(values, values.password)).every((error) => !error));
  assert.ok(validateRegistration({ ...values, firstName: "a".repeat(101) }, values.password).firstName);
  assert.ok(validateRegistration({ ...values, lastName: "a".repeat(101) }, values.password).lastName);
});

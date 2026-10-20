import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { normalizeRegistration, validateRegistration, validateUsername, validateEmail, validatePassword } from "../src/utils/registrationValidation.js";

test("el usuario exige 3–15 caracteres y el formato permitido por el backend", () => {
  for (const value of ["abc", "Usuario_18.test", "User_18.test-"]) assert.equal(validateUsername(value), "");
  for (const value of ["", "ab", "a".repeat(16), "José", "dos nombres", "<user>"]) assert.ok(validateUsername(value), value);
});

test("el correo admite hasta 254 caracteres con parte local de hasta 64", () => {
  const longest = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(61);
  for (const value of ["user+tag@example.com", "a".repeat(45) + "@b.com", longest]) assert.equal(validateEmail(value), "");
  for (const value of ["", "user@", "a@@b.com", "a..b@example.com", ".a@example.com", "a.@example.com", "a@-example.com", "a@exa mple.com", "a".repeat(65) + "@b.com", longest + "e"]) assert.ok(validateEmail(value), value);
});

test("reserva nombres del sistema y sus variantes, sin bloquear coincidencias parciales", () => {
  for (const value of ["root", "sysroot", "admin", "administrador", "manager", "ADMIN", "a-d-m-i-n", "root_01", ".admin.", "sys_root123", "SoPoRtE", "fuelytics"]) assert.match(validateUsername(value), /reservado/, value);
  for (const value of ["rootbeer", "managerial", "modesto", "administrativo", "my_admin"]) assert.equal(validateUsername(value), "", value);
});

test("frontend y backend mantienen la misma lista de nombres reservados", () => {
  const source = readFileSync(new URL("../../backend/src/main/java/com/fuelytics/backend/validation/ReservedUsernames.java", import.meta.url), "utf8");
  const names = [...source.match(/Set\.of\(([\s\S]*?)\);/)[1].matchAll(/"([a-z]+)"/g)].map((match) => match[1]);
  assert.ok(names.length >= 30);
  for (const name of names) assert.match(validateUsername(name), /reservado/, name);
});

test("la contraseña respeta el mínimo de 8 y el máximo de 72 bytes sin recortarla", () => {
  for (const value of ["Abcdefgh", "Aa" + "a".repeat(70), "É" + "é".repeat(35), "Aa" + "🚗".repeat(17) + "é", "  Clave  "]) assert.equal(validatePassword(value), "");
  for (const value of ["", "        ", "Abcdefg", "Aa" + "a".repeat(71), "É" + "é".repeat(36), "Aa" + "🚗".repeat(18)]) assert.ok(validatePassword(value), value);
});

test("el registro exige mayúscula y minúscula, con números y símbolos opcionales", () => {
  for (const value of ["abcdefgh", "ABCDEFGH", "12345678", "🚗".repeat(8), "abcdef1!", "ABCDEF1!"]) assert.match(validatePassword(value), /mayúscula y una minúscula/, value);
  for (const value of ["Abcdefgh", "ÁrbolesÉ", "Жж".repeat(4), "Clave123", "Clave!!!", "Clave\ncon saltos"]) assert.equal(validatePassword(value), "", value);
});

test("se normalizan identidad y nombres, conservando exactamente la contraseña", () => {
  const body = normalizeRegistration({ username: " Usuario ", email: " NEW@EXAMPLE.COM ", password: "  Clave  ", firstName: " María ", lastName: " García " });
  assert.deepEqual(body, { username: "Usuario", email: "new@example.com", password: "  Clave  ", firstName: "María", lastName: "García" });
  assert.ok(Object.values(validateRegistration(body, "  Clave  ")).every((error) => !error));
  assert.ok(validateRegistration(body, "clave").confirmPassword);
});

test("se rechazan campos vacíos y nombres que superan el máximo del backend", () => {
  const empty = validateRegistration({ username: "", email: "", password: "", firstName: "", lastName: "" }, "");
  for (const field of ["username", "email", "password", "confirmPassword"]) assert.ok(empty[field]);
  const values = { username: "user", email: "a@b.com", password: "Abcdefgh", firstName: "a".repeat(100), lastName: "b".repeat(100) };
  assert.ok(Object.values(validateRegistration(values, values.password)).every((error) => !error));
  assert.ok(validateRegistration({ ...values, firstName: "a".repeat(101) }, values.password).firstName);
  assert.ok(validateRegistration({ ...values, lastName: "a".repeat(101) }, values.password).lastName);
});

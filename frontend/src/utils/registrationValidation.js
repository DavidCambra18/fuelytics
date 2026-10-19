export const REGISTRATION_LIMITS = { usernameMin: 3, usernameMax: 15, emailMax: 254, nameMax: 100, passwordMin: 8, passwordMax: 72 };

export function validateUsername(value) {
  if (!value) return "El nombre de usuario es obligatorio";
  if (value.length < 3 || value.length > 15) return "El nombre de usuario debe tener entre 3 y 15 caracteres";
  if (!/^[A-Za-z0-9._-]+$/.test(value)) return "Utiliza solo letras sin tildes, números, puntos, guiones y guiones bajos";
  return "";
}

export function validateEmail(value) {
  if (!value) return "El correo electrónico es obligatorio";
  if (value.length > 254) return "El correo electrónico no puede superar 254 caracteres";
  // Match the email input's syntax and reject local-part dots that @Email also rejects.
  const syntax = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*$/;
  const local = value.split("@")[0];
  const domain = value.split("@")[1] || "";
  if (local.length > 64 || domain.split(".").some((part) => part.length > 63) || !syntax.test(value) || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return "El correo electrónico no es válido";
  return "";
}

export function validatePassword(value) {
  if (!value.trim()) return "La contraseña es obligatoria";
  if (value.length < 8 || value.length > 72) return "La contraseña debe tener entre 8 y 72 caracteres";
  if (new TextEncoder().encode(value).length > 72) return "La contraseña supera el límite de 72 bytes; las tildes y los emojis ocupan más de un byte";
  return "";
}

export function normalizeRegistration(values) {
  return {
    username: values.username.trim(),
    email: values.email.trim().toLowerCase(),
    password: values.password,
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
  };
}

export function validateRegistration(values, confirmPassword) {
  return {
    username: validateUsername(values.username),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    confirmPassword: !confirmPassword ? "Confirma tu contraseña" : confirmPassword !== values.password ? "Las contraseñas no coinciden" : "",
    firstName: values.firstName.length > 100 ? "El nombre no puede superar 100 caracteres" : "",
    lastName: values.lastName.length > 100 ? "El apellido no puede superar 100 caracteres" : "",
  };
}

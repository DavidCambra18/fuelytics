package com.fuelytics.backend.validation;

import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public final class ReservedUsernames {
    public static final String MESSAGE = "Este nombre de usuario está reservado. Elige otro nombre";
    private static final Set<String> NAMES = Set.of(
            "root", "sysroot", "rootuser", "admin", "admins", "administrator", "administrador",
            "administradora", "administradores", "administracion", "administration", "manager",
            "superadmin", "superuser", "sysadmin", "webadmin", "webmaster", "system", "sistema",
            "mod", "moderator", "moderador", "moderadora", "support", "soporte", "staff",
            "official", "oficial", "security", "seguridad", "owner", "propietario", "fuelytics");

    private ReservedUsernames() { }

    public static boolean isReserved(String value) {
        if (value == null) return false;
        String canonical = value.trim().toLowerCase(Locale.ROOT).replaceAll("[._-]", "").replaceAll("[0-9]+$", "");
        return NAMES.contains(canonical);
    }

    public static void requireAllowed(String value) {
        if (isReserved(value)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, MESSAGE);
    }
}

package com.fuelytics.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private final JwtService jwtService = new JwtService(
            "clave-de-pruebas-segura-con-mas-de-32-caracteres",
            60_000);

    @Test
    void generatesAndReadsSignedTokens() {
        String token = jwtService.generateToken("persona@example.com");

        assertTrue(jwtService.isTokenValid(token));
        assertEquals("persona@example.com", jwtService.extractEmail(token));
    }

    @Test
    void rejectsManipulatedTokens() {
        String token = jwtService.generateToken("persona@example.com");
        String manipulated = token.substring(0, token.length() - 1) + (token.endsWith("a") ? "b" : "a");

        assertFalse(jwtService.isTokenValid(manipulated));
    }
}

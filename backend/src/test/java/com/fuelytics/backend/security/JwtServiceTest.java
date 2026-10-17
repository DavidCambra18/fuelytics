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
        String token = jwtService.generateToken("persona@example.com", 1);

        assertTrue(jwtService.isTokenValid(token));
        assertEquals("persona@example.com", jwtService.extractEmail(token));
        assertTrue(jwtService.belongsToUser(token, 1));
    }

    @Test
    void rejectsManipulatedTokens() {
        String token = jwtService.generateToken("persona@example.com", 1);
        String manipulated = token.substring(0, token.length() - 1) + (token.endsWith("a") ? "b" : "a");

        assertFalse(jwtService.isTokenValid(manipulated));
    }

    @Test
    void oldTokenDoesNotBelongToRecreatedAccountWithSameEmail() {
        String token = jwtService.generateToken("persona@example.com", 1);
        assertFalse(jwtService.belongsToUser(token, 2));
        assertFalse(jwtService.belongsToUser(token, null));
    }

    @Test
    void legacyTokenWithoutAccountIdentifierIsRejected() {
        String token = io.jsonwebtoken.Jwts.builder()
                .subject("persona@example.com")
                .expiration(new java.util.Date(System.currentTimeMillis() + 60_000))
                .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        "clave-de-pruebas-segura-con-mas-de-32-caracteres".getBytes(java.nio.charset.StandardCharsets.UTF_8)))
                .compact();
        assertTrue(jwtService.isTokenValid(token));
        assertFalse(jwtService.belongsToUser(token, 1));
    }
}

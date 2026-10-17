package com.fuelytics.backend.security;

import java.util.Date;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private final SecretKey key;

    private final long expirationTime;

    public JwtService(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.jwt.expiration-ms:3600000}") long expirationTime) {
        byte[] secretBytes;

        try {
            secretBytes = Base64.getDecoder().decode(jwtSecret);
        } catch (IllegalArgumentException exception) {
            secretBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }

        this.key = Keys.hmacShaKeyFor(secretBytes);
        this.expirationTime = expirationTime;
    }

    public String generateToken(String email, Integer userId) {
        if (userId == null || userId < 1) {
            throw new IllegalArgumentException("El token debe estar vinculado a una cuenta existente");
        }
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(key)
                .compact();
    }

    public boolean belongsToUser(String token, Integer userId) {
        try {
            Integer tokenUserId = Jwts.parser().verifyWith(key).build()
                    .parseSignedClaims(token).getPayload().get("userId", Integer.class);
            return userId != null && userId.equals(tokenUserId);
        } catch (Exception exception) {
            return false;
        }
    }

    public String extractEmail(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean isTokenValid(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token);

            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

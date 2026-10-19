package com.fuelytics.backend.security;

import static org.junit.jupiter.api.Assertions.*;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jose.jwk.source.ImmutableJWKSet;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.web.server.ResponseStatusException;

class GoogleTokenVerifierTest {
    private static JwtEncoder encoder;
    private static GoogleTokenVerifier verifier;

    @BeforeAll static void setup() throws Exception {
        var generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        var pair = generator.generateKeyPair();
        var publicKey = (RSAPublicKey) pair.getPublic();
        var jwk = new RSAKey.Builder(publicKey).privateKey((RSAPrivateKey) pair.getPrivate()).build();
        encoder = new NimbusJwtEncoder(new ImmutableJWKSet<>(new JWKSet(jwk)));
        verifier = new GoogleTokenVerifier("client.apps.googleusercontent.com", NimbusJwtDecoder.withPublicKey(publicKey).build());
    }

    @Test
    void verifiesSignatureAndNormalizesVerifiedIdentity() {
        var identity = verifier.verify(token(Map.of()), "expected-nonce");
        assertEquals("google-subject", identity.subject());
        assertEquals("user@example.com", identity.email());
        assertEquals("María", identity.firstName());
    }

    @Test
    void rejectsWrongIssuerAudienceExpiryNonceAndUnverifiedEmails() {
        for (var claims : List.<Map<String, Object>>of(
                Map.of("iss", "https://attacker.example"), Map.of("aud", List.of("wrong-client")),
                Map.of("exp", Instant.now().minusSeconds(120), "iat", Instant.now().minusSeconds(240)), Map.of("iat", Instant.now().minusSeconds(400)),
                Map.of("iat", Instant.now().plusSeconds(120), "exp", Instant.now().plusSeconds(600)), Map.of("azp", "wrong-client"),
                Map.of("nonce", "wrong-nonce"), Map.of("email_verified", false), Map.of("sub", ""))) {
            assertThrows(ResponseStatusException.class, () -> verifier.verify(token(claims), "expected-nonce"), claims.toString());
        }
    }

    @Test
    void rejectsTokensWithInvalidSignatures() {
        String token = token(Map.of());
        String[] parts = token.split("\\.");
        String signature = parts[2];
        parts[2] = (signature.startsWith("a") ? "b" : "a") + signature.substring(1);
        assertThrows(ResponseStatusException.class, () -> verifier.verify(String.join(".", parts), "expected-nonce"));
    }

    @Test
    void disabledVerifierDoesNotAttemptAuthentication() {
        var disabled = new GoogleTokenVerifier("");
        assertFalse(disabled.enabled());
        assertThrows(ResponseStatusException.class, () -> disabled.verify("anything", "nonce"));
    }

    private String token(Map<String, Object> overrides) {
        var claims = JwtClaimsSet.builder().issuer("https://accounts.google.com").audience(List.of("client.apps.googleusercontent.com"))
                .subject("google-subject").issuedAt(Instant.now().minusSeconds(10)).expiresAt(Instant.now().plusSeconds(120))
                .claim("email", "USER@EXAMPLE.COM").claim("email_verified", true).claim("nonce", "expected-nonce").claim("given_name", "María");
        overrides.forEach(claims::claim);
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(SignatureAlgorithm.RS256).build(), claims.build())).getTokenValue();
    }
}

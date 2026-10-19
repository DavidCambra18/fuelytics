package com.fuelytics.backend.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GoogleTokenVerifier {
    private final String clientId;
    private final JwtDecoder decoder;

    @Autowired
    public GoogleTokenVerifier(@Value("${app.google.client-id:}") String clientId) {
        this(clientId, decoder());
    }

    private static NimbusJwtDecoder decoder() {
        var requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(5));
        requestFactory.setReadTimeout(Duration.ofSeconds(5));
        return NimbusJwtDecoder.withJwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .jwsAlgorithm(SignatureAlgorithm.RS256)
                .restOperations(new RestTemplate(requestFactory)).build();
    }

    // Tests use the same validators with locally signed RSA tokens instead of Google's live keys.
    GoogleTokenVerifier(String clientId, NimbusJwtDecoder decoder) {
        this.clientId = clientId.trim();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefault(), token -> {
            Instant now = Instant.now();
            boolean valid = Set.of("https://accounts.google.com", "accounts.google.com").contains(token.getClaimAsString("iss"))
                    && token.getAudience().contains(this.clientId)
                    && token.getExpiresAt() != null && token.getExpiresAt().isAfter(now)
                    && token.getIssuedAt() != null && token.getIssuedAt().isAfter(now.minusSeconds(300))
                    && !token.getIssuedAt().isAfter(now.plusSeconds(60))
                    && (token.getClaimAsString("azp") == null || this.clientId.equals(token.getClaimAsString("azp")));
            return valid ? OAuth2TokenValidatorResult.success() : OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Identidad de Google no válida", null));
        }));
        this.decoder = decoder;
    }

    public boolean enabled() { return !clientId.isBlank(); }
    public String clientId() { return clientId; }

    public GoogleIdentity verify(String credential, String nonce) {
        if (!enabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "El acceso con Google no está configurado");
        try {
            Jwt token = decoder.decode(credential);
            String subject = token.getSubject();
            String email = token.getClaimAsString("email");
            String actualNonce = token.getClaimAsString("nonce");
            if (subject == null || subject.isBlank() || subject.length() > 255 || email == null
                    || !Boolean.TRUE.equals(token.getClaim("email_verified")) || actualNonce == null
                    || !MessageDigest.isEqual(actualNonce.getBytes(StandardCharsets.UTF_8), nonce.getBytes(StandardCharsets.UTF_8))) {
                throw new IllegalArgumentException();
            }
            return new GoogleIdentity(subject, email.trim().toLowerCase(Locale.ROOT),
                    name(token.getClaimAsString("given_name")), name(token.getClaimAsString("family_name")));
        } catch (Exception exception) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No se pudo verificar tu identidad de Google. Vuelve a intentarlo.");
        }
    }

    private String name(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        int end = Math.min(100, trimmed.length());
        if (end > 0 && Character.isHighSurrogate(trimmed.charAt(end - 1))) end--;
        return trimmed.isEmpty() ? null : trimmed.substring(0, end);
    }
}

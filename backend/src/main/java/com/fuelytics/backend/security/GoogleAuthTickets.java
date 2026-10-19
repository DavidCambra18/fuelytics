package com.fuelytics.backend.security;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component
public class GoogleAuthTickets {
    public enum Purpose { LOGIN, LINK, DELETE_ACCOUNT }
    public record Challenge(String id, String nonce, Purpose purpose, Integer userId, long expiresAt) { }
    public record Registration(String id, GoogleIdentity identity, long expiresAt) { }
    private final Map<String, Challenge> challenges = new HashMap<>();
    private final Map<String, Registration> registrations = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;

    public GoogleAuthTickets() { this(Clock.systemUTC()); }
    GoogleAuthTickets(Clock clock) { this.clock = clock; }

    public synchronized Challenge issue(Purpose purpose, Integer userId) {
        prune();
        checkCapacity();
        var challenge = new Challenge(token(), token(), purpose, userId, clock.millis() + Duration.ofMinutes(5).toMillis());
        challenges.put(challenge.id(), challenge);
        return challenge;
    }

    public synchronized Challenge consume(String id, Purpose purpose, Integer userId) {
        var challenge = challenges.get(id);
        if (challenge == null || challenge.expiresAt() <= clock.millis() || challenge.purpose() != purpose
                || !java.util.Objects.equals(challenge.userId(), userId)) throw expired();
        challenges.remove(id);
        return challenge;
    }

    public synchronized Registration issueRegistration(GoogleIdentity identity) {
        prune();
        checkCapacity();
        var registration = new Registration(token(), identity, clock.millis() + Duration.ofMinutes(10).toMillis());
        registrations.put(registration.id(), registration);
        return registration;
    }

    public synchronized Registration registration(String id) {
        var registration = registrations.get(id);
        if (registration == null || registration.expiresAt() <= clock.millis()) throw expired();
        return registration;
    }

    public synchronized void finish(Registration registration) { registrations.remove(registration.id(), registration); }

    private void prune() {
        challenges.values().removeIf(value -> value.expiresAt() <= clock.millis());
        registrations.values().removeIf(value -> value.expiresAt() <= clock.millis());
    }

    private void checkCapacity() {
        if (challenges.size() + registrations.size() >= 10000) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Demasiados accesos pendientes. Inténtalo más tarde.");
        }
    }

    private String token() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private ResponseStatusException expired() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "La confirmación de Google ha caducado o ya se ha usado. Vuelve a conectar con Google.");
    }
}

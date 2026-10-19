package com.fuelytics.backend.security;

import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.security.GoogleAuthTickets.Purpose;

class GoogleAuthTicketsTest {
    @Test
    void challengesAreRandomSingleUseAndBoundToPurposeAndUser() {
        var tickets = new GoogleAuthTickets();
        var challenge = tickets.issue(Purpose.LINK, 7);
        assertEquals(43, challenge.id().length());
        assertEquals(43, challenge.nonce().length());
        assertNotEquals(challenge.id(), challenge.nonce());
        assertThrows(ResponseStatusException.class, () -> tickets.consume(challenge.id(), Purpose.LOGIN, null));
        assertThrows(ResponseStatusException.class, () -> tickets.consume(challenge.id(), Purpose.LINK, 8));
        assertEquals(challenge, tickets.consume(challenge.id(), Purpose.LINK, 7));
        assertThrows(ResponseStatusException.class, () -> tickets.consume(challenge.id(), Purpose.LINK, 7));
    }

    @Test
    void expiredChallengesAndRegistrationsAreRejected() {
        var clock = new MutableClock();
        var tickets = new GoogleAuthTickets(clock);
        var challenge = tickets.issue(Purpose.LOGIN, null);
        var registration = tickets.issueRegistration(new GoogleIdentity("subject", "user@example.com", null, null));
        clock.now = clock.now.plusSeconds(301);
        assertThrows(ResponseStatusException.class, () -> tickets.consume(challenge.id(), Purpose.LOGIN, null));
        assertEquals(registration, tickets.registration(registration.id()));
        clock.now = clock.now.plusSeconds(301);
        assertThrows(ResponseStatusException.class, () -> tickets.registration(registration.id()));
    }

    @Test
    void finishingRegistrationInvalidatesItsTicket() {
        var tickets = new GoogleAuthTickets();
        var registration = tickets.issueRegistration(new GoogleIdentity("subject", "user@example.com", null, null));
        tickets.finish(registration);
        assertThrows(ResponseStatusException.class, () -> tickets.registration(registration.id()));
    }

    private static class MutableClock extends Clock {
        Instant now = Instant.parse("2026-10-19T10:00:00Z");
        @Override public ZoneId getZone() { return ZoneOffset.UTC; }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now; }
    }
}

package com.fuelytics.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class AuthRateLimitFilterTest {

    @Test
    void rejectsLoginAttemptsAboveTheConfiguredLimit() throws Exception {
        Clock clock = Clock.fixed(Instant.parse("2026-10-14T12:00:00Z"), ZoneOffset.UTC);
        AuthRateLimitFilter filter = new AuthRateLimitFilter(2, 1, 60_000, clock);

        assertEquals(200, execute(filter, "/api/users/login").getStatus());
        assertEquals(200, execute(filter, "/api/users/login").getStatus());

        MockHttpServletResponse rejected = execute(filter, "/api/users/login");
        assertEquals(429, rejected.getStatus());
        assertEquals("60", rejected.getHeader("Retry-After"));
    }

    @Test
    void keepsLoginAndRegistrationLimitsIndependent() throws Exception {
        Clock clock = Clock.fixed(Instant.parse("2026-10-14T12:00:00Z"), ZoneOffset.UTC);
        AuthRateLimitFilter filter = new AuthRateLimitFilter(2, 1, 60_000, clock);

        assertEquals(200, execute(filter, "/api/users/register").getStatus());
        assertEquals(429, execute(filter, "/api/users/register").getStatus());
        assertEquals(200, execute(filter, "/api/users/login").getStatus());
    }

    private MockHttpServletResponse execute(AuthRateLimitFilter filter, String path) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setRemoteAddr("203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}

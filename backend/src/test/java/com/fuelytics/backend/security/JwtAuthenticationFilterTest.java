package com.fuelytics.backend.security;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class JwtAuthenticationFilterTest {
    private final JwtService jwt = new JwtService("clave-de-pruebas-segura-con-mas-de-32-caracteres", 60_000);
    private final UserRepository users = mock(UserRepository.class);
    private final JwtAuthenticationFilter filter = new JwtAuthenticationFilter(jwt, users);

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void rejectsSessionsOfDeletedAccount() throws Exception {
        when(users.findByEmail("owner@example.com")).thenReturn(null);
        assertEquals(401, execute(1).getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void rejectsOldSessionAfterSameEmailIsRegisteredAgain() throws Exception {
        User replacement = new User();
        replacement.setId(2);
        when(users.findByEmail("owner@example.com")).thenReturn(replacement);
        assertEquals(401, execute(1).getStatus());
        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }

    @Test
    void acceptsSessionOfCurrentAccount() throws Exception {
        User current = new User();
        current.setId(2);
        when(users.findByEmail("owner@example.com")).thenReturn(current);
        assertEquals(200, execute(2).getStatus());
        assertEquals("owner@example.com", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    private MockHttpServletResponse execute(int userId) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/users/profile");
        request.addHeader("Authorization", "Bearer " + jwt.generateToken("owner@example.com", userId));
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }
}

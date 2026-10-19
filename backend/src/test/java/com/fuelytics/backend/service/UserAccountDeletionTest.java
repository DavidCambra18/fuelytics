package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;
import com.fuelytics.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class UserAccountDeletionTest {
    private final UserRepository users = mock(UserRepository.class);
    private final BCryptPasswordEncoder encoder = mock(BCryptPasswordEncoder.class);
    private final UserService service = new UserService(users, mock(VehicleRepository.class), encoder, mock(JwtService.class), mock(ApplicationEventPublisher.class));
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(42);
        user.setEmail("owner@example.com");
        user.setPassword("stored-hash");
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(user);
    }

    @Test
    void correctPasswordDeletesOnlyAuthenticatedAccount() {
        when(encoder.matches("correct-password", "stored-hash")).thenReturn(true);

        service.deleteAccount(user.getEmail(), "correct-password");

        var order = inOrder(users, encoder);
        order.verify(users).findByEmailForUpdate("owner@example.com");
        order.verify(encoder).matches("correct-password", "stored-hash");
        order.verify(users).delete(user);
        order.verify(users).flush();
    }

    @Test
    void incorrectPasswordKeepsAccount() {
        when(encoder.matches("wrong-password", "stored-hash")).thenReturn(false);
        var error = assertThrows(ResponseStatusException.class,
                () -> service.deleteAccount(user.getEmail(), "wrong-password"));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(users, never()).delete(any());
        verify(users, never()).flush();
    }

    @Test
    void blankPasswordNeverDeletesAccount() {
        for (String password : new String[] { null, "", "   " }) {
            assertThrows(ResponseStatusException.class, () -> service.deleteAccount(user.getEmail(), password));
        }
        verifyNoInteractions(encoder);
        verify(users, never()).delete(any());
    }

    @Test
    void missingAccountReturnsNotFound() {
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(null);
        var error = assertThrows(ResponseStatusException.class,
                () -> service.deleteAccount(user.getEmail(), "correct-password"));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        verifyNoInteractions(encoder);
        verify(users, never()).delete(any());
    }

    @Test
    void googleOnlyAccountCannotBeDeletedWithLocalPassword() {
        user.setPassword(null);
        assertThrows(ResponseStatusException.class, () -> service.deleteAccount(user.getEmail(), "any-password"));
        verifyNoInteractions(encoder);
        verify(users, never()).delete(any());
    }
}

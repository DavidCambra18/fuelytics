package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.fuelytics.backend.dto.UserRegisterDTO;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.notification.MailNotification;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;
import com.fuelytics.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

class UserRegistrationNotificationTest {
    private final UserRepository users = mock(UserRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final BCryptPasswordEncoder encoder = mock(BCryptPasswordEncoder.class);
    private final UserService service = new UserService(users, mock(VehicleRepository.class), encoder,
            mock(JwtService.class), events);

    @Test
    void successfulRegistrationPublishesWelcomeAfterSavingUser() {
        var dto = registration();
        when(encoder.encode("Password-test")).thenReturn("hash");
        service.register(dto);
        var order = inOrder(users, events);
        order.verify(users).existsByEmail("new@example.com");
        order.verify(users).existsByUsername("usuario");
        order.verify(users).save(any(User.class));
        order.verify(events).publishEvent(MailNotification.welcome("new@example.com", "usuario"));
    }

    @Test
    void duplicateRegistrationDoesNotPublishWelcome() {
        when(users.existsByEmail("new@example.com")).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.register(registration()));
        verifyNoInteractions(events);
    }

    private UserRegisterDTO registration() {
        var dto = new UserRegisterDTO();
        dto.setUsername(" usuario ");
        dto.setEmail(" NEW@example.com ");
        dto.setPassword("Password-test");
        return dto;
    }

    @Test
    void availabilityChecksUseTheSameNormalizationAsRegistration() {
        service.emailExists(" NEW@example.com ");
        service.usernameExists(" usuario ");
        verify(users).existsByEmail("new@example.com");
        verify(users).existsByUsername("usuario");
    }
}

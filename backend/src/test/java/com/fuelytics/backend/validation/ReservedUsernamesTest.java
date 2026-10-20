package com.fuelytics.backend.validation;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.List;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.GoogleAuthRequests.RegistrationRequest;
import com.fuelytics.backend.dto.UserProfileDTO;
import com.fuelytics.backend.dto.UserRegisterDTO;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.repository.VehicleRepository;
import com.fuelytics.backend.security.JwtService;
import com.fuelytics.backend.service.UserService;

class ReservedUsernamesTest {
    private static final List<String> RESERVED = List.of("root", "sysroot", "admin", "administrador", "manager", "ADMIN", "a-d-m-i-n", "root_01", ".admin.", "sys_root123", "SoPoRtE", "fuelytics");
    private final UserRepository users = mock(UserRepository.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final UserService service = new UserService(users, mock(VehicleRepository.class), new BCryptPasswordEncoder(), mock(JwtService.class), events);

    @Test
    void blocksSystemIdentitiesWithoutRejectingOrdinaryNamesContainingThem() {
        for (String value : RESERVED) assertTrue(ReservedUsernames.isReserved(value), value);
        assertTrue(ReservedUsernames.isReserved(" ADMIN "));
        for (String value : List.of("rootbeer", "managerial", "modesto", "administrativo", "my_admin")) assertFalse(ReservedUsernames.isReserved(value), value);
        assertFalse(ReservedUsernames.isReserved(null));
    }

    @Test
    void ordinaryAndGoogleRegistrationRejectReservedUsernamesAtValidationBoundary() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            for (String value : RESERVED) {
                var registration = new UserRegisterDTO();
                registration.setUsername(value);
                assertTrue(validator.validateProperty(registration, "username").stream().anyMatch(error -> error.getMessage().equals(ReservedUsernames.MESSAGE)), value);
                var google = new RegistrationRequest("a".repeat(43), value);
                assertFalse(validator.validateProperty(google, "username").isEmpty(), value);
            }
        }
    }

    @Test
    void registrationAndAvailabilityRejectReservedNamesBeforeDatabaseAccess() {
        for (String value : RESERVED) {
            var registration = new UserRegisterDTO();
            registration.setEmail("user@example.com");
            registration.setUsername(value);
            var error = assertThrows(ResponseStatusException.class, () -> service.register(registration));
            assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
            assertThrows(ResponseStatusException.class, () -> service.usernameExists(value));
        }
        verifyNoInteractions(users, events);
    }

    @Test
    void changingAProfileCannotBypassTheReservation() {
        var user = new User();
        user.setId(7);
        user.setUsername("usuario");
        when(users.findByEmail("user@example.com")).thenReturn(user);
        for (String value : RESERVED) {
            var update = new UserProfileDTO();
            update.setUsername(value);
            assertThrows(ResponseStatusException.class, () -> service.updateProfile("user@example.com", update));
            assertEquals("usuario", user.getUsername());
        }
        verify(users, never()).save(any());
    }

    @Test
    void existingReservedUsernamesCanKeepTheirNameAndUpdateOtherProfileDetails() {
        var user = new User();
        user.setId(7);
        user.setUsername("admin");
        when(users.findByEmail("user@example.com")).thenReturn(user);
        var update = new UserProfileDTO();
        update.setUsername("admin");
        update.setFirstName("María");
        var result = service.updateProfile("user@example.com", update);
        assertEquals("admin", result.getUsername());
        assertEquals("María", result.getFirstName());
        verify(users).save(user);
    }
}

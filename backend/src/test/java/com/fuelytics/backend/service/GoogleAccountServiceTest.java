package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterAll;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.entity.*;
import com.fuelytics.backend.notification.MailNotification;
import com.fuelytics.backend.repository.*;
import com.fuelytics.backend.security.*;

class GoogleAccountServiceTest {
    private static final jakarta.validation.ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    @AfterAll static void closeFactory() { FACTORY.close(); }
    private final UserRepository users = mock(UserRepository.class);
    private final GoogleAccountRepository accounts = mock(GoogleAccountRepository.class);
    private final JwtService jwt = mock(JwtService.class);
    private final BCryptPasswordEncoder encoder = mock(BCryptPasswordEncoder.class);
    private final ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
    private final GoogleIdentity identity = new GoogleIdentity("google-id", "user@example.com", "María", "García");
    private final GoogleAccountService service;

    GoogleAccountServiceTest() {
        service = new GoogleAccountService(users, accounts, jwt, encoder, events, FACTORY.getValidator());
    }

    @Test
    void returningGoogleAccountUsesStableSubjectEvenIfProviderEmailChanged() {
        var user = user("original@example.com", null);
        when(accounts.findByGoogleSubject(identity.subject())).thenReturn(Optional.of(new GoogleAccount(user, identity.subject())));
        when(jwt.generateToken(user.getEmail(), 7)).thenReturn("app-token");
        assertEquals("app-token", service.login(identity).orElseThrow().get("token"));
        verify(users, never()).existsByEmail(anyString());
    }

    @Test
    void emailCollisionNeverAutomaticallyLinksExistingLocalAccount() {
        when(users.existsByEmail(identity.email())).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.login(identity));
        verify(accounts, never()).saveAndFlush(any());
    }

    @Test
    void newGoogleRegistrationHasNoPasswordAndSendsOneWelcome() {
        when(users.saveAndFlush(any())).thenAnswer(call -> { User user = call.getArgument(0); user.setId(7); return user; });
        when(jwt.generateToken(identity.email(), 7)).thenReturn("app-token");
        assertEquals("app-token", service.register(identity, "usuario").get("token"));
        var userCaptor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).saveAndFlush(userCaptor.capture());
        assertNull(userCaptor.getValue().getPassword());
        verify(accounts).saveAndFlush(any(GoogleAccount.class));
        verify(events).publishEvent(MailNotification.welcome(identity.email(), "usuario"));
    }

    @Test
    void googleRegistrationCannotChooseAReservedName() {
        assertThrows(ResponseStatusException.class, () -> service.register(identity, "ADMIN_01"));
        verifyNoInteractions(users, accounts, events, jwt);
    }

    @Test
    void usernameConflictDoesNotSaveUserOrSendMail() {
        when(users.existsByUsername("ocupado")).thenReturn(true);
        assertThrows(ResponseStatusException.class, () -> service.register(identity, "ocupado"));
        verify(users, never()).saveAndFlush(any());
        verifyNoInteractions(events);
    }

    @Test
    void linkingRequiresCurrentLocalPassword() {
        var user = user(identity.email(), "hash");
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(user);
        assertThrows(ResponseStatusException.class, () -> service.link(user.getEmail(), identity, "wrong"));
        verify(accounts, never()).saveAndFlush(any());
        when(encoder.matches("correct", "hash")).thenReturn(true);
        service.link(user.getEmail(), identity, "correct");
        verify(accounts).saveAndFlush(any(GoogleAccount.class));
    }

    @Test
    void cannotUnlinkOnlyAccessMethod() {
        var user = user(identity.email(), null);
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(user);
        assertThrows(ResponseStatusException.class, () -> service.unlink(user.getEmail(), "anything"));
        verify(accounts, never()).delete(any());
    }

    @Test
    void deletionRequiresExactlyTheLinkedGoogleSubject() {
        var user = user(identity.email(), null);
        when(users.findByEmailForUpdate(user.getEmail())).thenReturn(user);
        when(accounts.findById(7)).thenReturn(Optional.of(new GoogleAccount(user, "different-subject")));
        assertThrows(ResponseStatusException.class, () -> service.deleteAccount(user.getEmail(), identity));
        verify(users, never()).delete(any());
        verify(accounts, never()).delete(any());
        var linked = new GoogleAccount(user, identity.subject());
        when(accounts.findById(7)).thenReturn(Optional.of(linked));
        service.deleteAccount(user.getEmail(), identity);
        var order = inOrder(accounts, users);
        order.verify(accounts).delete(linked);
        order.verify(accounts).flush();
        order.verify(users).delete(user);
        order.verify(users).flush();
    }

    private User user(String email, String password) {
        var user = new User();
        user.setId(7);
        user.setEmail(email);
        user.setUsername("usuario");
        user.setPassword(password);
        return user;
    }
}

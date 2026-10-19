package com.fuelytics.backend.controller;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.security.Principal;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.GoogleAuthRequests.*;
import com.fuelytics.backend.security.*;
import com.fuelytics.backend.security.GoogleAuthTickets.Purpose;
import com.fuelytics.backend.service.GoogleAccountService;

class GoogleAuthControllerTest {
    private final GoogleTokenVerifier verifier = mock(GoogleTokenVerifier.class);
    private final GoogleAccountService accounts = mock(GoogleAccountService.class);
    private final GoogleAuthTickets tickets = new GoogleAuthTickets();
    private final GoogleAuthController controller = new GoogleAuthController(verifier, tickets, accounts, "https://app.example");

    @Test
    void anonymousRequestsCannotCreateLinkOrDeletionChallenges() {
        when(verifier.enabled()).thenReturn(true);
        for (var purpose : new Purpose[]{Purpose.LINK, Purpose.DELETE_ACCOUNT}) {
            assertThrows(ResponseStatusException.class, () -> controller.challenge("https://app.example", new ChallengeRequest(purpose), null));
        }
        verifyNoInteractions(accounts);
    }

    @Test
    void rejectsMissingOrUntrustedOriginsBeforeTouchingGoogleCredentials() {
        for (String origin : new String[]{null, "https://attacker.example"}) {
            assertThrows(ResponseStatusException.class,
                    () -> controller.login(origin, new CredentialRequest("credential", "challenge", null)));
        }
        verifyNoInteractions(accounts, verifier);
    }

    @Test
    void challengesCannotBeReusedForLogin() {
        when(verifier.enabled()).thenReturn(true);
        var challenge = tickets.issue(Purpose.LOGIN, null);
        var identity = new GoogleIdentity("subject", "user@example.com", null, null);
        when(verifier.verify("credential", challenge.nonce())).thenReturn(identity);
        when(accounts.login(identity)).thenReturn(Optional.of(Map.of("token", "app-token")));
        var request = new CredentialRequest("credential", challenge.id(), null);
        assertEquals("app-token", controller.login("https://app.example", request).get("token"));
        assertThrows(ResponseStatusException.class, () -> controller.login("https://app.example", request));
        verify(verifier, times(1)).verify(anyString(), anyString());
    }

    @Test
    void completedRegistrationTicketIsSingleUseAndConflictsCanBeRetried() {
        when(verifier.enabled()).thenReturn(true);
        var identity = new GoogleIdentity("subject", "user@example.com", null, null);
        var pending = tickets.issueRegistration(identity);
        var request = new RegistrationRequest(pending.id(), "usuario");
        when(accounts.register(identity, "usuario")).thenThrow(new ResponseStatusException(org.springframework.http.HttpStatus.CONFLICT, "Ocupado"))
                .thenReturn(Map.of("token", "app-token"));
        assertThrows(ResponseStatusException.class, () -> controller.register("https://app.example", request));
        assertEquals("app-token", controller.register("https://app.example", request).get("token"));
        assertThrows(ResponseStatusException.class, () -> controller.register("https://app.example", request));
        verify(accounts, times(2)).register(identity, "usuario");
    }

    @Test
    void deletionProofIsBoundToTheCurrentAuthenticatedUser() {
        when(verifier.enabled()).thenReturn(true);
        Principal user = () -> "user@example.com";
        when(accounts.userId(user.getName())).thenReturn(7);
        var otherUsersChallenge = tickets.issue(Purpose.DELETE_ACCOUNT, 8);
        assertThrows(ResponseStatusException.class, () -> controller.deleteAccount("https://app.example",
                new CredentialRequest("credential", otherUsersChallenge.id(), null), user));
        verify(verifier, never()).verify(anyString(), anyString());
        verify(accounts, never()).deleteAccount(anyString(), any());
    }

    @Test
    void beansStartWithoutGoogleConfigurationOrNetworkAccess() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(new MapPropertySource("test", Map.of("app.cors.allowed-origin", "https://app.example")));
            context.registerBean(GoogleAccountService.class, () -> accounts);
            context.register(GoogleTokenVerifier.class, GoogleAuthTickets.class, GoogleAuthController.class);
            context.refresh();
            assertEquals(false, context.getBean(GoogleAuthController.class).config().get("enabled"));
        }
    }
}

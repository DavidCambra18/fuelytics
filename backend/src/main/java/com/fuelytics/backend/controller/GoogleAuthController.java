package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.Map;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.GoogleAuthRequests.*;
import com.fuelytics.backend.security.GoogleAuthTickets;
import com.fuelytics.backend.security.GoogleAuthTickets.Purpose;
import com.fuelytics.backend.security.GoogleIdentity;
import com.fuelytics.backend.security.GoogleTokenVerifier;
import com.fuelytics.backend.service.GoogleAccountService;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleAuthController {
    private final GoogleTokenVerifier verifier;
    private final GoogleAuthTickets tickets;
    private final GoogleAccountService accounts;
    private final String frontendOrigin;

    public GoogleAuthController(GoogleTokenVerifier verifier, GoogleAuthTickets tickets, GoogleAccountService accounts,
            @Value("${app.cors.allowed-origin}") String frontendOrigin) {
        this.verifier = verifier;
        this.tickets = tickets;
        this.accounts = accounts;
        this.frontendOrigin = frontendOrigin.replaceAll("/+$", "");
    }

    @GetMapping("/config")
    public Map<String, Object> config() { return Map.of("enabled", verifier.enabled(), "clientId", verifier.clientId()); }

    @ModelAttribute
    public void disableCaching(HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Referrer-Policy", "no-referrer");
    }

    @GetMapping("/status")
    public Map<String, Object> status(Principal principal) { return accounts.status(requirePrincipal(principal), verifier.enabled()); }

    @PostMapping("/challenge")
    public Map<String, String> challenge(@RequestHeader(value = "Origin", required = false) String origin,
            @Valid @RequestBody ChallengeRequest request, Principal principal) {
        requireOrigin(origin);
        requireEnabled();
        Integer userId = request.purpose() == Purpose.LOGIN ? null : accounts.userId(requirePrincipal(principal));
        var challenge = tickets.issue(request.purpose(), userId);
        return Map.of("challengeId", challenge.id(), "nonce", challenge.nonce());
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestHeader(value = "Origin", required = false) String origin,
            @Valid @RequestBody CredentialRequest request) {
        requireOrigin(origin);
        GoogleIdentity identity = verify(request, Purpose.LOGIN, null);
        var session = accounts.login(identity);
        if (session.isPresent()) return session.get();
        var pending = tickets.issueRegistration(identity);
        return Map.of("registrationRequired", true, "registrationToken", pending.id(), "email", identity.email());
    }

    @PostMapping("/register")
    public Map<String, Object> register(@RequestHeader(value = "Origin", required = false) String origin,
            @Valid @RequestBody RegistrationRequest request) {
        requireOrigin(origin);
        requireEnabled();
        var pending = tickets.registration(request.registrationToken());
        synchronized (pending) {
            // Recheck after taking the ticket lock to prevent parallel/replayed account creation.
            tickets.registration(pending.id());
            var result = accounts.register(pending.identity(), request.username());
            tickets.finish(pending);
            return result;
        }
    }

    @PostMapping("/link")
    public ResponseEntity<Void> link(@RequestHeader(value = "Origin", required = false) String origin,
            @Valid @RequestBody CredentialRequest request, Principal principal) {
        requireOrigin(origin);
        String email = requirePrincipal(principal);
        accounts.link(email, verify(request, Purpose.LINK, accounts.userId(email)), request.password());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/link")
    public ResponseEntity<Void> unlink(@RequestHeader(value = "Origin", required = false) String origin,
            @Valid @RequestBody UnlinkRequest request, Principal principal) {
        requireOrigin(origin);
        accounts.unlink(requirePrincipal(principal), request.password());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(@RequestHeader(value = "Origin", required = false) String origin,
            @Valid @RequestBody CredentialRequest request, Principal principal) {
        requireOrigin(origin);
        String email = requirePrincipal(principal);
        accounts.deleteAccount(email, verify(request, Purpose.DELETE_ACCOUNT, accounts.userId(email)));
        return ResponseEntity.noContent().build();
    }

    private GoogleIdentity verify(CredentialRequest request, Purpose purpose, Integer userId) {
        requireEnabled();
        var challenge = tickets.consume(request.challengeId(), purpose, userId);
        return verifier.verify(request.credential(), challenge.nonce());
    }

    private String requirePrincipal(Principal principal) {
        if (principal == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Inicia sesión para gestionar tu cuenta de Google");
        return principal.getName();
    }

    private void requireEnabled() {
        if (!verifier.enabled()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "El acceso con Google no está configurado");
    }

    private void requireOrigin(String origin) {
        // JSON + an exact Origin check: no cookies or third-party-cookie exceptions are needed.
        if (!frontendOrigin.equals(origin)) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Origen de autenticación no permitido");
    }
}

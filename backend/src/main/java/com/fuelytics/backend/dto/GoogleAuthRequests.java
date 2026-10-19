package com.fuelytics.backend.dto;

import com.fuelytics.backend.security.GoogleAuthTickets.Purpose;
import com.fuelytics.backend.validation.Utf8Size;
import jakarta.validation.constraints.*;

public final class GoogleAuthRequests {
    private GoogleAuthRequests() { }

    public record ChallengeRequest(@NotNull Purpose purpose) { }

    public record CredentialRequest(
            @NotBlank @Size(max = 16000) String credential,
            @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String challengeId,
            @Size(max = 72) @Utf8Size(max = 72) String password) { }

    public record RegistrationRequest(
            @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String registrationToken,
            @NotBlank @Size(min = 3, max = 15, message = "El nombre de usuario debe tener entre 3 y 15 caracteres")
            @Pattern(regexp = "[A-Za-z0-9._-]+", message = "El nombre de usuario contiene caracteres no permitidos") String username) {
        public RegistrationRequest {
            username = username == null ? null : username.trim();
        }
    }

    public record UnlinkRequest(@NotBlank @Size(max = 72) @Utf8Size(max = 72) String password) { }
}

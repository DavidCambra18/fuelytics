package com.fuelytics.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeleteAccountDTO(
        @NotBlank(message = "Introduce tu contraseña para confirmar la eliminación")
        @Size(max = 72, message = "La contraseña no puede superar los 72 caracteres")
        String password) {
}

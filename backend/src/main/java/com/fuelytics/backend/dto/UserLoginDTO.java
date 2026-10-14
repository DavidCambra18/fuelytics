package com.fuelytics.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserLoginDTO {

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no es válido")
    @Size(max = 50, message = "El correo electrónico no puede superar 50 caracteres")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(max = 72, message = "La contraseña no puede superar 72 caracteres")
    private String password;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

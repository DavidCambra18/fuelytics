package com.fuelytics.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserRegisterDTO {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 15, message = "El nombre de usuario debe tener entre 3 y 15 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El nombre de usuario contiene caracteres no permitidos")
    private String username;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no es válido")
    @Size(max = 50, message = "El correo electrónico no puede superar 50 caracteres")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    private String password;

    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String firstName;

    @Size(max = 100, message = "El apellido no puede superar 100 caracteres")
    private String lastName;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

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

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }
}

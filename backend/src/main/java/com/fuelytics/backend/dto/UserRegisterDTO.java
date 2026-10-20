package com.fuelytics.backend.dto;

import java.util.Locale;
import com.fuelytics.backend.validation.Utf8Size;
import com.fuelytics.backend.validation.NotReservedUsername;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UserRegisterDTO {

    @NotBlank(message = "El nombre de usuario es obligatorio")
    @Size(min = 3, max = 15, message = "El nombre de usuario debe tener entre 3 y 15 caracteres")
    @Pattern(regexp = "^[A-Za-z0-9._-]+$", message = "El nombre de usuario contiene caracteres no permitidos")
    @NotReservedUsername
    private String username;

    @NotBlank(message = "El correo electrónico es obligatorio")
    @Email(message = "El correo electrónico no es válido")
    @Size(max = 254, message = "El correo electrónico no puede superar 254 caracteres")
    private String email;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 8, max = 72, message = "La contraseña debe tener entre 8 y 72 caracteres")
    @Utf8Size(max = 72, message = "La contraseña supera el límite de 72 bytes; las tildes y los emojis ocupan más de un byte")
    @Pattern(regexp = "(?s)(?=.*\\p{Lu})(?=.*\\p{Ll}).*", message = "La contraseña debe incluir al menos una letra mayúscula y una minúscula")
    private String password;

    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String firstName;

    @Size(max = 100, message = "El apellido no puede superar 100 caracteres")
    private String lastName;

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username == null ? null : username.trim();
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
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
        this.firstName = firstName == null ? null : firstName.trim();
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName == null ? null : lastName.trim();
    }
}

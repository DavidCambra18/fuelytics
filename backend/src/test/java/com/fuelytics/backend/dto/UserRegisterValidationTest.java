package com.fuelytics.backend.dto;

import static org.junit.jupiter.api.Assertions.*;
import java.util.List;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;

class UserRegisterValidationTest {
    private static final ValidatorFactory FACTORY = Validation.buildDefaultValidatorFactory();
    private static final Validator VALIDATOR = FACTORY.getValidator();

    @AfterAll static void closeFactory() { FACTORY.close(); }

    @Test
    void enforcesUsernameLengthAndAllowedCharacters() {
        for (String value : List.of("abc", "Usuario_18.test", "User_18.test-")) {
            var dto = registration();
            dto.setUsername(value);
            assertTrue(VALIDATOR.validate(dto).isEmpty(), value);
        }
        for (String value : List.of("", "ab", "a".repeat(16), "José", "dos nombres", "<user>")) {
            var dto = registration();
            dto.setUsername(value);
            assertInvalid(dto, "username");
        }
    }

    @Test
    void enforcesPasswordCharacterMinimumAndBcryptByteMaximum() {
        for (String value : List.of("Abcdefgh", "Aa" + "a".repeat(70), "É" + "é".repeat(35), "Aa" + "🚗".repeat(17) + "é", "  Clave  ")) {
            var dto = registration();
            dto.setPassword(value);
            assertTrue(VALIDATOR.validate(dto).isEmpty(), value);
        }
        for (String value : List.of("", "        ", "Abcdefg", "Aa" + "a".repeat(71), "É" + "é".repeat(36), "Aa" + "🚗".repeat(18))) {
            var dto = registration();
            dto.setPassword(value);
            assertInvalid(dto, "password");
        }
    }

    @Test
    void requiresUppercaseAndLowercaseButNotDigitsOrSymbols() {
        for (String value : List.of("abcdefgh", "ABCDEFGH", "12345678", "🚗".repeat(8), "abcdef1!", "ABCDEF1!")) {
            var dto = registration();
            dto.setPassword(value);
            assertInvalid(dto, "password");
        }
        for (String value : List.of("Abcdefgh", "ÁrbolesÉ", "Жж".repeat(4), "Clave123", "Clave!!!", "Clave\ncon saltos")) {
            var dto = registration();
            dto.setPassword(value);
            assertTrue(VALIDATOR.validate(dto).isEmpty(), value);
        }
    }

    @Test
    void existingPasswordsCanStillBeUsedToSignIn() {
        var login = new UserLoginDTO();
        login.setEmail("user@example.com");
        login.setPassword("12345678");
        assertTrue(VALIDATOR.validate(login).isEmpty());
    }

    @Test
    void enforcesEmailAndNameLimits() {
        var dto = registration();
        String longest = "a".repeat(64) + "@" + "b".repeat(63) + "." + "c".repeat(63) + "." + "d".repeat(61);
        dto.setEmail(longest);
        dto.setFirstName("a".repeat(100));
        dto.setLastName("b".repeat(100));
        assertTrue(VALIDATOR.validate(dto).isEmpty());
        dto.setEmail(longest + "e");
        dto.setFirstName("a".repeat(101));
        dto.setLastName("b".repeat(101));
        assertInvalid(dto, "email");
        assertInvalid(dto, "firstName");
        assertInvalid(dto, "lastName");
        for (String email : List.of("user@", "a@@b.com", "a..b@example.com", ".a@example.com", "a.@example.com", "a@-example.com", "a@exa mple.com")) {
            dto.setEmail(email);
            assertInvalid(dto, "email");
        }
    }

    @Test
    void normalizesIdentityBeforeValidationWithoutChangingPassword() {
        var dto = registration();
        dto.setUsername(" Usuario ");
        dto.setEmail(" NEW@EXAMPLE.COM ");
        dto.setFirstName(" María ");
        dto.setLastName(" García ");
        dto.setPassword("  Clave  ");
        assertEquals("Usuario", dto.getUsername());
        assertEquals("new@example.com", dto.getEmail());
        assertEquals("María", dto.getFirstName());
        assertEquals("García", dto.getLastName());
        assertEquals("  Clave  ", dto.getPassword());
        assertTrue(VALIDATOR.validate(dto).isEmpty());
    }

    private void assertInvalid(UserRegisterDTO dto, String field) {
        assertTrue(VALIDATOR.validate(dto).stream().anyMatch(error -> error.getPropertyPath().toString().equals(field)), field);
    }

    private UserRegisterDTO registration() {
        var dto = new UserRegisterDTO();
        dto.setUsername("usuario");
        dto.setEmail("user@example.com");
        dto.setPassword("Abcdefgh");
        return dto;
    }
}

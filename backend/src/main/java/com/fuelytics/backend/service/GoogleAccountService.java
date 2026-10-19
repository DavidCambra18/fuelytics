package com.fuelytics.backend.service;

import java.util.Map;
import java.util.Optional;
import jakarta.validation.Validator;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.fuelytics.backend.dto.UserRegisterDTO;
import com.fuelytics.backend.entity.GoogleAccount;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.notification.MailNotification;
import com.fuelytics.backend.repository.GoogleAccountRepository;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.security.GoogleIdentity;
import com.fuelytics.backend.security.JwtService;

@Service
public class GoogleAccountService {
    private final UserRepository users;
    private final GoogleAccountRepository accounts;
    private final JwtService jwt;
    private final BCryptPasswordEncoder encoder;
    private final ApplicationEventPublisher events;
    private final Validator validator;

    public GoogleAccountService(UserRepository users, GoogleAccountRepository accounts, JwtService jwt,
            BCryptPasswordEncoder encoder, ApplicationEventPublisher events, Validator validator) {
        this.users = users;
        this.accounts = accounts;
        this.jwt = jwt;
        this.encoder = encoder;
        this.events = events;
        this.validator = validator;
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> login(GoogleIdentity identity) {
        var account = accounts.findByGoogleSubject(identity.subject());
        if (account.isPresent()) return Optional.of(session(account.get().getUser()));
        if (users.existsByEmail(identity.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ya existe una cuenta con este correo. Inicia sesión con tu contraseña y vincula Google desde Ajustes → Cuenta.");
        }
        return Optional.empty();
    }

    @Transactional
    public Map<String, Object> register(GoogleIdentity identity, String username) {
        if (accounts.findByGoogleSubject(identity.subject()).isPresent() || users.existsByEmail(identity.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta cuenta ya está registrada. Vuelve a iniciar sesión.");
        }
        if (users.existsByUsername(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "El nombre de usuario ya está en uso");
        }
        // Apply the same identity/name constraints as ordinary registration, with no fabricated password.
        var data = new UserRegisterDTO();
        data.setUsername(username);
        data.setEmail(identity.email());
        data.setFirstName(identity.firstName());
        data.setLastName(identity.lastName());
        for (String field : new String[] { "username", "email", "firstName", "lastName" }) {
            var violations = validator.validateProperty(data, field);
            if (!violations.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, violations.iterator().next().getMessage());
        }
        User user = new User();
        user.setUsername(data.getUsername());
        user.setEmail(data.getEmail());
        user.setFirstName(data.getFirstName());
        user.setLastName(data.getLastName());
        user.setPassword(null);
        user.setProfilePublic(true);
        users.saveAndFlush(user);
        accounts.saveAndFlush(new GoogleAccount(user, identity.subject()));
        events.publishEvent(MailNotification.welcome(user.getEmail(), user.getUsername()));
        return session(user);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> status(String email, boolean enabled) {
        User user = requireUser(email, false);
        return Map.of("enabled", enabled, "linked", accounts.existsById(user.getId()), "hasPassword", user.getPassword() != null);
    }

    @Transactional(readOnly = true)
    public Integer userId(String email) { return requireUser(email, false).getId(); }

    @Transactional
    public void link(String email, GoogleIdentity identity, String password) {
        User user = requireUser(email, true);
        checkPassword(user, password);
        if (accounts.existsById(user.getId()) || accounts.findByGoogleSubject(identity.subject()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Esta cuenta de Fuelytics o de Google ya tiene una vinculación");
        }
        accounts.saveAndFlush(new GoogleAccount(user, identity.subject()));
    }

    @Transactional
    public void unlink(String email, String password) {
        User user = requireUser(email, true);
        if (user.getPassword() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Google es tu único método de acceso y no se puede desvincular");
        }
        checkPassword(user, password);
        var account = accounts.findById(user.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No tienes Google vinculado"));
        accounts.delete(account);
        accounts.flush();
    }

    @Transactional
    public void deleteAccount(String email, GoogleIdentity identity) {
        User user = requireUser(email, true);
        var account = accounts.findById(user.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Esta cuenta no tiene Google vinculado"));
        if (!account.getGoogleSubject().equals(identity.subject())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Confirma la eliminación con la misma cuenta de Google que tienes vinculada");
        }
        // Remove the managed association before its user; database cascades alone do not
        // prevent Hibernate's transient-reference check on an already loaded GoogleAccount.
        accounts.delete(account);
        accounts.flush();
        users.delete(user);
        users.flush();
    }

    private void checkPassword(User user, String password) {
        if (user.getPassword() == null || password == null || password.isBlank() || !encoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "La contraseña actual no es correcta");
        }
    }

    private User requireUser(String email, boolean lock) {
        User user = lock ? users.findByEmailForUpdate(email) : users.findByEmail(email);
        if (user == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        return user;
    }

    private Map<String, Object> session(User user) {
        return Map.of("token", jwt.generateToken(user.getEmail(), user.getId()), "username", user.getUsername(), "email", user.getEmail(), "registrationRequired", false);
    }
}

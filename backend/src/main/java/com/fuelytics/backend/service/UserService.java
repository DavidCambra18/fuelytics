package com.fuelytics.backend.service;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.UserPrivacyDTO;
import com.fuelytics.backend.dto.UserLoginDTO;
import com.fuelytics.backend.dto.UserProfileDTO;
import com.fuelytics.backend.dto.UserRegisterDTO;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.security.JwtService;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String register(UserRegisterDTO dto) {

        if (userRepository.existsByEmail(dto.getEmail())) {
            return "Email ya en uso";
        }

        if (userRepository.existsByUsername(dto.getUsername())) {
            return "Username ya en uso";
        }

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setFirstName(normalize(dto.getFirstName()));
        user.setLastName(normalize(dto.getLastName()));
        user.setProfilePublic(true);

        userRepository.save(user);

        return "Usuario registrado correctamente";
    }

    public UserProfileDTO getProfile(String email) {
        User user = findUserByEmail(email);
        return toProfileDTO(user);
    }

    public UserProfileDTO getPublicProfile(String username, String currentEmail) {
        User user = userRepository.findByUsername(username);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }

        boolean isOwner = currentEmail != null && currentEmail.equals(user.getEmail());

        if (!Boolean.TRUE.equals(user.getProfilePublic()) && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Este perfil es privado");
        }

        return toProfileDTO(user);
    }

    public UserProfileDTO updateProfile(String email, UserProfileDTO dto) {
        User user = findUserByEmail(email);
        String nextUsername = normalize(dto.getUsername());

        if (nextUsername != null && !nextUsername.equals(user.getUsername())
                && userRepository.existsByUsernameAndIdNot(nextUsername, user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Usuario ya en uso");
        }

        if (nextUsername != null) {
            user.setUsername(nextUsername);
        }

        user.setFirstName(normalize(dto.getFirstName()));
        user.setLastName(normalize(dto.getLastName()));

        userRepository.save(user);

        return toProfileDTO(user);
    }

    public UserProfileDTO updatePrivacy(String email, UserPrivacyDTO dto) {
        User user = findUserByEmail(email);

        if (dto.getProfilePublic() != null) {
            user.setProfilePublic(dto.getProfilePublic());
        }

        userRepository.save(user);

        return toProfileDTO(user);
    }

    private User findUserByEmail(String email) {
        User user = userRepository.findByEmail(email);

        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }

        return user;
    }

    private UserProfileDTO toProfileDTO(User user) {
        UserProfileDTO dto = new UserProfileDTO();
        dto.setUsername(user.getUsername());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setProfilePublic(user.getProfilePublic());
        return dto;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public Map<String, String> login(UserLoginDTO dto) {

        User user = userRepository.findByEmail(dto.getEmail());

        if (user == null) {
            return Map.of("error", "Usuario no encontrado");
        }

        if (!passwordEncoder.matches(dto.getPassword(), user.getPassword())) {
            return Map.of("error", "Contraseña incorrecta");
        }

        String token = jwtService.generateToken(user.getEmail());

        return Map.of(
            "token", token,
            "username", user.getUsername(),
            "email", user.getEmail());
    }
}
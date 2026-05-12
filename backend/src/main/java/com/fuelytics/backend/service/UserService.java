package com.fuelytics.backend.service;

import java.util.Map;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.fuelytics.backend.dto.UserLoginDTO;
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

        userRepository.save(user);

        return "Usuario registrado correctamente";
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
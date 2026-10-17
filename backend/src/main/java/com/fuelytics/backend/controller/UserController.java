package com.fuelytics.backend.controller;

import java.util.Map;
import java.security.Principal;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import com.fuelytics.backend.dto.UserPrivacyDTO;
import com.fuelytics.backend.dto.UserLoginDTO;
import com.fuelytics.backend.dto.UserProfileDTO;
import com.fuelytics.backend.dto.UserRegisterDTO;
import com.fuelytics.backend.dto.DeleteAccountDTO;
import com.fuelytics.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody UserRegisterDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.register(dto));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@Valid @RequestBody UserLoginDTO dto) {
        return ResponseEntity.ok(userService.login(dto));
    }

    @GetMapping("/profile")
    public UserProfileDTO getProfile(Principal principal) {
        return userService.getProfile(principal.getName());
    }

    @DeleteMapping("/account")
    public ResponseEntity<Void> deleteAccount(Principal principal, @Valid @RequestBody DeleteAccountDTO request) {
        userService.deleteAccount(principal.getName(), request.password());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/public/{username}")
    public ResponseEntity<UserProfileDTO> getPublicProfile(@PathVariable String username, Principal principal) {
        String currentEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(userService.getPublicProfile(username, currentEmail));
    }

    @PutMapping("/profile")
    public UserProfileDTO updateProfile(Principal principal, @Valid @RequestBody UserProfileDTO dto) {
        return userService.updateProfile(principal.getName(), dto);
    }

    @PutMapping("/privacy")
    public UserProfileDTO updatePrivacy(Principal principal, @Valid @RequestBody UserPrivacyDTO dto) {
        return userService.updatePrivacy(principal.getName(), dto);
    }

    @GetMapping("/check-username")
    public ResponseEntity<Void> checkUsername(@RequestParam String username) {
        if (userService.usernameExists(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        return ResponseEntity.ok().build();
    }

    @GetMapping("/check-email")
    public ResponseEntity<Void> checkEmail(@RequestParam String email) {
        if (userService.emailExists(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        return ResponseEntity.ok().build();
    }
}

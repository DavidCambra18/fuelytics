package com.fuelytics.backend.controller;

import java.util.Map;
import java.security.Principal;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fuelytics.backend.dto.UserPrivacyDTO;
import com.fuelytics.backend.dto.UserLoginDTO;
import com.fuelytics.backend.dto.UserProfileDTO;
import com.fuelytics.backend.dto.UserRegisterDTO;
import com.fuelytics.backend.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public String register(@RequestBody UserRegisterDTO dto) {
        return userService.register(dto);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody UserLoginDTO dto) {
        return userService.login(dto);
    }

    @GetMapping("/profile")
    public UserProfileDTO getProfile(Principal principal) {
        return userService.getProfile(principal.getName());
    }

    @GetMapping("/public/{username}")
    public ResponseEntity<UserProfileDTO> getPublicProfile(@PathVariable String username, Principal principal) {
        String currentEmail = principal != null ? principal.getName() : null;
        return ResponseEntity.ok(userService.getPublicProfile(username, currentEmail));
    }

    @PutMapping("/profile")
    public UserProfileDTO updateProfile(Principal principal, @RequestBody UserProfileDTO dto) {
        return userService.updateProfile(principal.getName(), dto);
    }

    @PutMapping("/privacy")
    public UserProfileDTO updatePrivacy(Principal principal, @RequestBody UserPrivacyDTO dto) {
        return userService.updatePrivacy(principal.getName(), dto);
    }
}
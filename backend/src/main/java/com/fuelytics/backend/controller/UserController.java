package com.fuelytics.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

import com.fuelytics.backend.dto.UserLoginDTO;
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
}
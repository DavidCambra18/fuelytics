package com.fuelytics.backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.UserBadgeResponseDTO;
import com.fuelytics.backend.service.BadgeService;

@RestController
@RequestMapping("/api/badges")
public class BadgeController {

    private final BadgeService badgeService;

    public BadgeController(BadgeService badgeService) {
        this.badgeService = badgeService;
    }

    @GetMapping
    public ResponseEntity<List<UserBadgeResponseDTO>> getUserBadges(Authentication authentication) {
        String email = authentication.getName();
        List<UserBadgeResponseDTO> badges = badgeService.getUserBadges(email);
        return ResponseEntity.ok(badges);
    }
    @GetMapping("/public/{username}")
    public ResponseEntity<List<UserBadgeResponseDTO>> getPublicUserBadges(@PathVariable String username) {
        List<UserBadgeResponseDTO> badges = badgeService.getUserBadgesByUsername(username);
        return ResponseEntity.ok(badges);
    }

}
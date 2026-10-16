package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.FriendRequestDTO;
import com.fuelytics.backend.dto.FriendshipOverviewDTO;
import com.fuelytics.backend.dto.FriendshipUserDTO;
import com.fuelytics.backend.service.FriendshipService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/friendships")
public class FriendshipController {

    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    @GetMapping
    public FriendshipOverviewDTO getOverview(Principal principal) {
        return friendshipService.getOverview(principal.getName());
    }

    @GetMapping("/search")
    public List<FriendshipUserDTO> searchUsers(Principal principal, @RequestParam String username) {
        return friendshipService.searchUsers(principal.getName(), username);
    }

    @PostMapping("/requests")
    public ResponseEntity<FriendshipUserDTO> sendRequest(
            Principal principal,
            @Valid @RequestBody FriendRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(friendshipService.sendRequest(principal.getName(), request.username()));
    }

    @PutMapping("/{friendshipId}/accept")
    public FriendshipUserDTO acceptRequest(Principal principal, @PathVariable Integer friendshipId) {
        return friendshipService.acceptRequest(principal.getName(), friendshipId);
    }

    @PutMapping("/{friendshipId}/reject")
    public FriendshipUserDTO rejectRequest(Principal principal, @PathVariable Integer friendshipId) {
        return friendshipService.rejectRequest(principal.getName(), friendshipId);
    }

    @DeleteMapping("/{friendshipId}")
    public ResponseEntity<Void> deleteFriendship(Principal principal, @PathVariable Integer friendshipId) {
        friendshipService.deleteFriendship(principal.getName(), friendshipId);
        return ResponseEntity.noContent().build();
    }
}

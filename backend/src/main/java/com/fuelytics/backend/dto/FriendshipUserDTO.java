package com.fuelytics.backend.dto;

public record FriendshipUserDTO(
        Integer friendshipId,
        String username,
        String firstName,
        String lastName,
        String status,
        String direction) {
}

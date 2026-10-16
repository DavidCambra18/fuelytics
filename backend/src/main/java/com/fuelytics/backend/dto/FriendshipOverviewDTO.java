package com.fuelytics.backend.dto;

import java.util.List;

public record FriendshipOverviewDTO(
        List<FriendshipUserDTO> friends,
        List<FriendshipUserDTO> incomingRequests,
        List<FriendshipUserDTO> outgoingRequests) {
}

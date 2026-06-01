package com.fuelytics.backend.dto;

import java.time.Instant;
import java.util.List;

public record GasStationSearchResponseDTO(
        String fuelType,
        String areaLabel,
        Double radiusKm,
        Instant updatedAt,
        boolean sourceReady,
        String sourceError,
        int total,
        List<GasStationDTO> stations) {
}
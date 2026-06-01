package com.fuelytics.backend.dto;

public record GasStationDTO(
        String id,
        String brand,
        String name,
        String address,
        String postalCode,
        String municipality,
        String municipalityId,
        String province,
        String provinceId,
        Double latitude,
        Double longitude,
        String schedule,
        String margin,
        String fuelType,
        String fuelLabel,
        Double price,
        Double distanceKm) {
}
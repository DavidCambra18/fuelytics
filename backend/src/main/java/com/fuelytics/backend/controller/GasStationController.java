package com.fuelytics.backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.GasStationSearchResponseDTO;
import com.fuelytics.backend.service.GasStationService;

@RestController
@RequestMapping("/api/external/gas-stations")
public class GasStationController {

    private final GasStationService gasStationService;

    public GasStationController(GasStationService gasStationService) {
        this.gasStationService = gasStationService;
    }

    @GetMapping
    public ResponseEntity<GasStationSearchResponseDTO> getStations(
            @RequestParam(required = false) String municipio,
            @RequestParam(required = false) String provincia,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false) Double radiusKm,
            @RequestParam(required = false, defaultValue = "diesel") String fuelType) {

        return ResponseEntity.ok(gasStationService.findStations(municipio, provincia, lat, lng, radiusKm, fuelType));
    }
}
package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.fuelytics.backend.dto.FuelingDTO;
import com.fuelytics.backend.dto.FuelingResponseDTO;
import com.fuelytics.backend.service.FuelingService;

@RestController
@RequestMapping("/api/fuelings")
public class FuelingController {

    private final FuelingService fuelingService;

    public FuelingController(FuelingService fuelingService) {
        this.fuelingService = fuelingService;
    }

    @PostMapping
    public FuelingResponseDTO createFueling(
            @RequestBody FuelingDTO dto,
            Principal principal) {

        return fuelingService.createFueling(
                dto,
                principal.getName());
    }

    @GetMapping("/vehicle/{vehicleId}")
    public List<FuelingResponseDTO> getVehicleFuelings(
            @PathVariable Integer vehicleId,
            Principal principal) {

        return fuelingService.getVehicleFuelings(
                vehicleId,
                principal.getName());
    }

        @PutMapping("/{fuelingId}")
        public FuelingResponseDTO updateFueling(
            @PathVariable Integer fuelingId,
            @RequestBody FuelingDTO dto,
            Principal principal) {

        return fuelingService.updateFueling(
            fuelingId,
            dto,
            principal.getName());
        }

        @DeleteMapping("/{fuelingId}")
        public void deleteFueling(
            @PathVariable Integer fuelingId,
            Principal principal) {

        fuelingService.deleteFueling(
            fuelingId,
            principal.getName());
        }
}
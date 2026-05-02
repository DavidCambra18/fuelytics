package com.fuelytics.backend.controller;

import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.VehicleDTO;
import com.fuelytics.backend.dto.VehicleResponseDTO;
import com.fuelytics.backend.service.VehicleService;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    private final VehicleService vehicleService;

    public VehicleController(VehicleService vehicleService) {
        this.vehicleService = vehicleService;
    }

    @PostMapping
    public VehicleResponseDTO create(@RequestBody VehicleDTO dto) {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return vehicleService.createVehicle(dto, email);
    }

    @GetMapping
    public List<VehicleResponseDTO> getAll() {

        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        return vehicleService.getVehicles(email);
    }
}
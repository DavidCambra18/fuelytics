package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.dto.VehicleDTO;
import com.fuelytics.backend.dto.VehicleResponseDTO;
import com.fuelytics.backend.dto.VehicleUpdateDTO;
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

    @GetMapping("/{id}")
    public ResponseEntity<VehicleResponseDTO> getVehicleById(@PathVariable Integer id, Principal principal) {
        VehicleResponseDTO response = vehicleService.getVehicleById(id, principal.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<VehicleResponseDTO> updateVehicle(
            @PathVariable Integer id,
            @RequestBody VehicleUpdateDTO dto,
            Principal principal) {

        VehicleResponseDTO response = vehicleService.updateVehicle(id, dto, principal.getName());

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(
            @PathVariable Integer id,
            Principal principal) {

        vehicleService.deleteVehicle(id, principal.getName());

        return ResponseEntity.noContent().build();
    }
}
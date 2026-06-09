package com.fuelytics.backend.controller;

import java.util.List;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fuelytics.backend.dto.TireSetDTO;
import com.fuelytics.backend.dto.TireSetResponseDTO;
import com.fuelytics.backend.service.TireService;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/tires")
public class TireController {

    private final TireService tireService;

    public TireController(TireService tireService) {
        this.tireService = tireService;
    }

    @GetMapping
    public ResponseEntity<List<TireSetResponseDTO>> getTires(@PathVariable Integer vehicleId, Principal principal) {
        return ResponseEntity.ok(tireService.getVehicleTires(vehicleId, principal.getName()));
    }

    @PostMapping
    public ResponseEntity<TireSetResponseDTO> createTire(@PathVariable Integer vehicleId, @RequestBody TireSetDTO dto, Principal principal) {
        return ResponseEntity.ok(tireService.createTireSet(vehicleId, dto, principal.getName()));
    }

    @PutMapping("/{tireId}/deactivate")
    public ResponseEntity<Void> deactivateTire(@PathVariable Integer vehicleId, @PathVariable Integer tireId, @RequestParam Integer odometer, Principal principal) {
        tireService.deactivateTire(tireId, odometer, principal.getName());
        return ResponseEntity.ok().build();
    }
}
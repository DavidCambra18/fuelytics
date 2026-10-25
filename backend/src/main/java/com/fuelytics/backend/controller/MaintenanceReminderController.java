package com.fuelytics.backend.controller;

import java.security.Principal;
import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.fuelytics.backend.dto.*;
import com.fuelytics.backend.service.MaintenanceReminderService;

@RestController
@RequestMapping("/api/vehicles/{vehicleId}/reminders")
public class MaintenanceReminderController {
    private final MaintenanceReminderService service;
    public MaintenanceReminderController(MaintenanceReminderService service) { this.service = service; }
    public record Completion(@Positive(message = "El gasto no es válido") Integer expenseId) {}

    @GetMapping
    public List<MaintenanceReminderResponseDTO> list(@PathVariable Integer vehicleId, Principal principal) {
        return service.list(vehicleId, principal.getName());
    }
    @PostMapping
    public ResponseEntity<MaintenanceReminderResponseDTO> create(@PathVariable Integer vehicleId,
            @Valid @RequestBody MaintenanceReminderDTO dto, Principal principal) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.save(vehicleId, null, dto, principal.getName()));
    }
    @PutMapping("/{id}")
    public MaintenanceReminderResponseDTO update(@PathVariable Integer vehicleId, @PathVariable Integer id,
            @Valid @RequestBody MaintenanceReminderDTO dto, Principal principal) {
        return service.save(vehicleId, id, dto, principal.getName());
    }
    @PutMapping("/{id}/completion")
    public MaintenanceReminderResponseDTO complete(@PathVariable Integer vehicleId, @PathVariable Integer id,
            @Valid @RequestBody Completion dto, Principal principal) {
        return service.complete(vehicleId, id, dto.expenseId(), principal.getName());
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer vehicleId, @PathVariable Integer id, Principal principal) {
        service.delete(vehicleId, id, principal.getName());
        return ResponseEntity.noContent().build();
    }
}

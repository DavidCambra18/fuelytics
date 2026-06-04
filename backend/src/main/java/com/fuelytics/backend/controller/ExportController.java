package com.fuelytics.backend.controller;

import java.security.Principal;
import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fuelytics.backend.service.ExportService;

@RestController
@RequestMapping("/api/export")
public class ExportController {

    private final ExportService exportService;

    public ExportController(ExportService exportService) {
        this.exportService = exportService;
    }

    @GetMapping("/fuelings/{vehicleId}")
    public ResponseEntity<byte[]> exportFuelings(
            @PathVariable Integer vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Principal principal) {

        return exportService.exportFuelings(vehicleId, startDate, endDate, principal.getName());
    }

    @GetMapping("/expenses/{vehicleId}")
    public ResponseEntity<byte[]> exportExpenses(
            @PathVariable Integer vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Principal principal) {

        return exportService.exportExpenses(vehicleId, startDate, endDate, principal.getName());
    }

    @GetMapping("/summary/{vehicleId}")
    public ResponseEntity<byte[]> exportSummary(
            @PathVariable Integer vehicleId,
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate,
            Principal principal) {

        return exportService.exportSummary(vehicleId, startDate, endDate, principal.getName());
    }
}
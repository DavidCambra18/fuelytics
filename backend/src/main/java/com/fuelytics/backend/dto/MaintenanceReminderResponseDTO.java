package com.fuelytics.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record MaintenanceReminderResponseDTO(Integer id, Integer vehicleId, String title, String notes,
        Integer targetOdometer, LocalDate targetDate, Integer remainingKm, Long remainingDays,
        String urgency, String status, Integer expenseId, LocalDate completedDate, BigDecimal completedCost) {}

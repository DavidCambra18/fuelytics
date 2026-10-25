package com.fuelytics.backend.dto;

import java.time.LocalDate;
import jakarta.validation.constraints.*;

public record MaintenanceReminderDTO(
        @NotBlank(message = "El título es obligatorio") @Size(max = 120, message = "El título admite hasta 120 caracteres") String title,
        @Size(max = 500, message = "Las notas admiten hasta 500 caracteres") String notes,
        @Positive(message = "El odómetro previsto debe ser mayor que cero") Integer targetOdometer,
        LocalDate targetDate) {
    @AssertTrue(message = "Indica el odómetro previsto, una fecha o ambos")
    public boolean isScheduleSpecified() { return targetOdometer != null || targetDate != null; }
}

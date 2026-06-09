package com.fuelytics.backend.dto;

import java.time.LocalDate;

public class AlertResponseDTO {
    private String expenseType;
    private String description;
    private Integer remainingKm;
    private String urgency;
    private LocalDate nextMaintenanceDate;

    public String getExpenseType() {
        return expenseType;
    }

    public void setExpenseType(String expenseType) {
        this.expenseType = expenseType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getRemainingKm() {
        return remainingKm;
    }

    public void setRemainingKm(Integer remainingKm) {
        this.remainingKm = remainingKm;
    }

    public String getUrgency() {
        return urgency;
    }

    public void setUrgency(String urgency) {
        this.urgency = urgency;
    }

    public LocalDate getNextMaintenanceDate() {
        return nextMaintenanceDate;
    }

    public void setNextMaintenanceDate(LocalDate nextMaintenanceDate) {
        this.nextMaintenanceDate = nextMaintenanceDate;
    }
}
package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.ExpenseType;
import java.math.BigDecimal;
import java.time.LocalDate;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class ExpenseDTO {

    @NotNull(message = "El vehículo es obligatorio")
    private Integer vehicleId;
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate date;
    @NotNull(message = "El tipo de gasto es obligatorio")
    private ExpenseType type;
    @Size(max = 255, message = "La descripción no puede superar 255 caracteres")
    private String description;
    @NotNull(message = "El coste es obligatorio")
    @PositiveOrZero(message = "El coste no puede ser negativo")
    @Digits(integer = 6, fraction = 2, message = "El coste no tiene un formato válido")
    private BigDecimal cost;
    @Positive(message = "El identificador del neumático no es válido")
    private Integer tireSetId;
    @Positive(message = "El recordatorio no es válido")
    private Integer maintenanceReminderId;
    private boolean maintenanceReminderSpecified;

    public Integer getMaintenanceReminderId() { return maintenanceReminderId; }
    public void setMaintenanceReminderId(Integer value) { maintenanceReminderId = value; maintenanceReminderSpecified = true; }
    @com.fasterxml.jackson.annotation.JsonIgnore
    public boolean isMaintenanceReminderSpecified() { return maintenanceReminderSpecified; }
    @PositiveOrZero(message = "El próximo mantenimiento no puede ser negativo")
    private Integer nextMaintenanceKm;
    private java.time.LocalDate nextMaintenanceDate;

    public Integer getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(Integer vehicleId) {
        this.vehicleId = vehicleId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public ExpenseType getType() {
        return type;
    }

    public void setType(ExpenseType type) {
        this.type = type;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }

    public Integer getTireSetId() {
        return tireSetId;
    }

    public void setTireSetId(Integer tireSetId) {
        this.tireSetId = tireSetId;
    }

    public Integer getNextMaintenanceKm() {
        return nextMaintenanceKm;
    }

    public void setNextMaintenanceKm(Integer nextMaintenanceKm) {
        this.nextMaintenanceKm = nextMaintenanceKm;
    }

    public java.time.LocalDate getNextMaintenanceDate() {
        return nextMaintenanceDate;
    }

    public void setNextMaintenanceDate(java.time.LocalDate nextMaintenanceDate) {
        this.nextMaintenanceDate = nextMaintenanceDate;
    }
}

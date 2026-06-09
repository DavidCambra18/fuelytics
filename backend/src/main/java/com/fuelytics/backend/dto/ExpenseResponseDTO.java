package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.ExpenseType;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseResponseDTO {

    private Integer id;
    private Integer vehicleId;
    private LocalDate date;
    private ExpenseType type;
    private String description;
    private BigDecimal cost;
    private Integer tireSetId;
    private Integer nextMaintenanceKm;
    private java.time.LocalDate nextMaintenanceDate;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

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

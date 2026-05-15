package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.ExpenseType;
import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseDTO {

    private Integer vehicleId;
    private LocalDate date;
    private ExpenseType type;
    private String description;
    private BigDecimal cost;

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
}

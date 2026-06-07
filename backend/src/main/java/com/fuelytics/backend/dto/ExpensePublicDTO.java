package com.fuelytics.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpensePublicDTO {
    private Integer id;
    private LocalDate date;
    private String type;
    private BigDecimal cost;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public BigDecimal getCost() { return cost; }
    public void setCost(BigDecimal cost) { this.cost = cost; }
}
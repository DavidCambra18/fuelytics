package com.fuelytics.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class FuelEntryPublicDTO {
    private Integer id;
    private LocalDate date;
    private BigDecimal liters;
    private BigDecimal priceTotal;
    private BigDecimal distance;
    private BigDecimal boardConsumption;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public BigDecimal getLiters() { return liters; }
    public void setLiters(BigDecimal liters) { this.liters = liters; }
    public BigDecimal getPriceTotal() { return priceTotal; }
    public void setPriceTotal(BigDecimal priceTotal) { this.priceTotal = priceTotal; }
    public BigDecimal getDistance() { return distance; }
    public void setDistance(BigDecimal distance) { this.distance = distance; }
    public BigDecimal getBoardConsumption() { return boardConsumption; }
    public void setBoardConsumption(BigDecimal boardConsumption) { this.boardConsumption = boardConsumption; }
}
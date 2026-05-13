package com.fuelytics.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.fuelytics.backend.entity.enums.DrivingType;
import com.fuelytics.backend.entity.enums.FuelType;
import com.fuelytics.backend.entity.enums.RefuelingType;
import com.fuelytics.backend.entity.enums.TireType;

public class FuelingDTO {

    private Integer vehicleId;
    private LocalDate date;
    private Integer odometer;
    private RefuelingType refueling;
    private FuelType fuelType;
    private BigDecimal distance;
    private BigDecimal liters;
    private BigDecimal priceTotal;
    private DrivingType drivingType;
    private TireType tireType;
    private Boolean highway;
    private Boolean city;
    private Boolean road;
    private Boolean ac;
    private Boolean trailer;
    private BigDecimal boardConsumption;
    private Integer averageSpeed;
    private String notes;

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

    public Integer getOdometer() {
        return odometer;
    }

    public void setOdometer(Integer odometer) {
        this.odometer = odometer;
    }

    public RefuelingType getRefueling() {
        return refueling;
    }

    public void setRefueling(RefuelingType refueling) {
        this.refueling = refueling;
    }

    public FuelType getFuelType() {
        return fuelType;
    }

    public void setFuelType(FuelType fuelType) {
        this.fuelType = fuelType;
    }

    public BigDecimal getDistance() {
        return distance;
    }

    public void setDistance(BigDecimal distance) {
        this.distance = distance;
    }

    public BigDecimal getLiters() {
        return liters;
    }

    public void setLiters(BigDecimal liters) {
        this.liters = liters;
    }

    public BigDecimal getPriceTotal() {
        return priceTotal;
    }

    public void setPriceTotal(BigDecimal priceTotal) {
        this.priceTotal = priceTotal;
    }

    public DrivingType getDrivingType() {
        return drivingType;
    }

    public void setDrivingType(DrivingType drivingType) {
        this.drivingType = drivingType;
    }

    public TireType getTireType() {
        return tireType;
    }

    public void setTireType(TireType tireType) {
        this.tireType = tireType;
    }

    public Boolean getHighway() {
        return highway;
    }

    public void setHighway(Boolean highway) {
        this.highway = highway;
    }

    public Boolean getCity() {
        return city;
    }

    public void setCity(Boolean city) {
        this.city = city;
    }

    public Boolean getRoad() {
        return road;
    }

    public void setRoad(Boolean road) {
        this.road = road;
    }

    public Boolean getAc() {
        return ac;
    }

    public void setAc(Boolean ac) {
        this.ac = ac;
    }

    public Boolean getTrailer() {
        return trailer;
    }

    public void setTrailer(Boolean trailer) {
        this.trailer = trailer;
    }

    public BigDecimal getBoardConsumption() {
        return boardConsumption;
    }

    public void setBoardConsumption(BigDecimal boardConsumption) {
        this.boardConsumption = boardConsumption;
    }

    public Integer getAverageSpeed() {
        return averageSpeed;
    }

    public void setAverageSpeed(Integer averageSpeed) {
        this.averageSpeed = averageSpeed;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
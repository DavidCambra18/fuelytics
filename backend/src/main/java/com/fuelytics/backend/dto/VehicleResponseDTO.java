package com.fuelytics.backend.dto;

import java.math.BigDecimal;

import com.fuelytics.backend.entity.enums.FuelType;
import com.fuelytics.backend.entity.enums.GearboxType;
import com.fuelytics.backend.entity.enums.VehicleType;

public class VehicleResponseDTO {

    private Integer id;
    private VehicleType vehicleType;
    private String brand;
    private String model;
    private int power;
    private int cc;
    private int year;
    private Integer odometer;
    private String plate;
    private FuelType fuelType;
    private BigDecimal tankCapacity;
    private GearboxType gearbox;
    private BigDecimal officialConsumption;
    private Boolean showFuelData;
    private Boolean showExpenses;
    private Boolean showStatistics;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getBrand() {
        return brand;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public int getPower() {
        return power;
    }

    public void setPower(int power) {
        this.power = power;
    }

    public int getCc() {
        return cc;
    }

    public void setCc(int cc) {
        this.cc = cc;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public Integer getOdometer() {
        return odometer;
    }

    public void setOdometer(Integer odometer) {
        this.odometer = odometer;
    }

    public String getPlate() {
        return plate;
    }

    public void setPlate(String plate) {
        this.plate = plate;
    }

    public FuelType getFuelType() {
        return fuelType;
    }

    public void setFuelType(FuelType fuelType) {
        this.fuelType = fuelType;
    }

    public BigDecimal getTankCapacity() {
        return tankCapacity;
    }

    public void setTankCapacity(BigDecimal tankCapacity) {
        this.tankCapacity = tankCapacity;
    }

    public GearboxType getGearbox() {
        return gearbox;
    }

    public void setGearbox(GearboxType gearbox) {
        this.gearbox = gearbox;
    }

    public BigDecimal getOfficialConsumption() {
        return officialConsumption;
    }

    public void setOfficialConsumption(BigDecimal officialConsumption) {
        this.officialConsumption = officialConsumption;
    }

    public Boolean getShowFuelData() {
        return showFuelData;
    }

    public void setShowFuelData(Boolean showFuelData) {
        this.showFuelData = showFuelData;
    }

    public Boolean getShowExpenses() {
        return showExpenses;
    }

    public void setShowExpenses(Boolean showExpenses) {
        this.showExpenses = showExpenses;
    }

    public Boolean getShowStatistics() {
        return showStatistics;
    }

    public void setShowStatistics(Boolean showStatistics) {
        this.showStatistics = showStatistics;
    }
}
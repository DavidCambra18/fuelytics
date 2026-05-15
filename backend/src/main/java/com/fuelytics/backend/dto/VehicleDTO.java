package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.GearboxType;
import com.fuelytics.backend.entity.enums.VehicleEnergyType;
import com.fuelytics.backend.entity.enums.VehicleType;
import java.math.BigDecimal;

public class VehicleDTO {

    private VehicleType vehicleType;
    private VehicleEnergyType vehicleEnergyType;
    private String brand;
    private String model;
    private int power;
    private int cc;
    private int year;
    private Integer odometer;
    private String plate;

    private BigDecimal tankCapacity;
    private BigDecimal officialConsumption;
    private GearboxType gearbox;

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public VehicleEnergyType getVehicleEnergyType() {
        return vehicleEnergyType;
    }

    public void setVehicleEnergyType(VehicleEnergyType vehicleEnergyType) {
        this.vehicleEnergyType = vehicleEnergyType;
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

    public BigDecimal getTankCapacity() {
        return tankCapacity;
    }

    public void setTankCapacity(BigDecimal tankCapacity) {
        this.tankCapacity = tankCapacity;
    }

    public BigDecimal getOfficialConsumption() {
        return officialConsumption;
    }

    public void setOfficialConsumption(BigDecimal officialConsumption) {
        this.officialConsumption = officialConsumption;
    }

    public GearboxType getGearbox() {
        return gearbox;
    }

    public void setGearbox(GearboxType gearbox) {
        this.gearbox = gearbox;
    }
}
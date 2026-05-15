package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.GearboxType;
import com.fuelytics.backend.entity.enums.VehicleEnergyType;
import com.fuelytics.backend.entity.enums.VehicleType;
import java.math.BigDecimal;

public class VehicleUpdateDTO {

    private String brand;
    private String model;
    private Integer power;
    private Integer cc;
    private Integer year;
    private VehicleType vehicleType;
    private GearboxType gearbox;
    private VehicleEnergyType vehicleEnergyType;
    private Integer odometer;
    private String plate;
    private BigDecimal tankCapacity;
    private BigDecimal officialConsumption;

    public GearboxType getGearbox() {
        return gearbox;
    }

    public void setGearbox(GearboxType gearbox) {
        this.gearbox = gearbox;
    }

    public VehicleEnergyType getVehicleEnergyType() {
        return vehicleEnergyType;
    }

    public void setVehicleEnergyType(VehicleEnergyType vehicleEnergyType) {
        this.vehicleEnergyType = vehicleEnergyType;
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

    public BigDecimal getOfficialConsumption() {
        return officialConsumption;
    }

    public void setOfficialConsumption(BigDecimal officialConsumption) {
        this.officialConsumption = officialConsumption;
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

    public Integer getPower() {
        return power;
    }

    public void setPower(Integer power) {
        this.power = power;
    }

    public Integer getCc() {
        return cc;
    }

    public void setCc(Integer cc) {
        this.cc = cc;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public BigDecimal getTankCapacity() {
        return tankCapacity;
    }

    public void setTankCapacity(BigDecimal tankCapacity) {
        this.tankCapacity = tankCapacity;
    }

}

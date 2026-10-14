package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.GearboxType;
import com.fuelytics.backend.entity.enums.VehicleEnergyType;
import com.fuelytics.backend.entity.enums.VehicleType;
import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class VehicleDTO {

    @NotNull(message = "El tipo de vehículo es obligatorio")
    private VehicleType vehicleType;
    @NotNull(message = "El tipo de energía es obligatorio")
    private VehicleEnergyType vehicleEnergyType;
    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 100, message = "La marca no puede superar 100 caracteres")
    private String brand;
    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 100, message = "El modelo no puede superar 100 caracteres")
    private String model;
    @Positive(message = "La potencia debe ser mayor que cero")
    private int power;
    @PositiveOrZero(message = "La cilindrada no puede ser negativa")
    private int cc;
    @Min(value = 1886, message = "El año no es válido")
    @Max(value = 2100, message = "El año no es válido")
    private int year;
    @PositiveOrZero(message = "El odómetro no puede ser negativo")
    private Integer odometer;
    @Size(max = 20, message = "La matrícula no puede superar 20 caracteres")
    private String plate;

    @NotNull(message = "La capacidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La capacidad debe ser mayor que cero")
    @Digits(integer = 3, fraction = 2, message = "La capacidad no tiene un formato válido")
    private BigDecimal tankCapacity;
    @DecimalMin(value = "0.0", inclusive = false, message = "El consumo oficial debe ser mayor que cero")
    @Digits(integer = 3, fraction = 2, message = "El consumo oficial no tiene un formato válido")
    private BigDecimal officialConsumption;
    @NotNull(message = "La caja de cambios es obligatoria")
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

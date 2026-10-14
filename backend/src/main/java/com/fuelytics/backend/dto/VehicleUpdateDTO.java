package com.fuelytics.backend.dto;

import com.fuelytics.backend.entity.enums.GearboxType;
import com.fuelytics.backend.entity.enums.VehicleEnergyType;
import com.fuelytics.backend.entity.enums.VehicleType;
import java.math.BigDecimal;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class VehicleUpdateDTO {

    @Size(min = 1, max = 100, message = "La marca debe tener entre 1 y 100 caracteres")
    private String brand;
    @Size(min = 1, max = 100, message = "El modelo debe tener entre 1 y 100 caracteres")
    private String model;
    @Positive(message = "La potencia debe ser mayor que cero")
    private Integer power;
    @PositiveOrZero(message = "La cilindrada no puede ser negativa")
    private Integer cc;
    @Min(value = 1886, message = "El año no es válido")
    @Max(value = 2100, message = "El año no es válido")
    private Integer year;
    private VehicleType vehicleType;
    private GearboxType gearbox;
    private VehicleEnergyType vehicleEnergyType;
    @PositiveOrZero(message = "El odómetro no puede ser negativo")
    private Integer odometer;
    @Size(max = 20, message = "La matrícula no puede superar 20 caracteres")
    private String plate;
    @DecimalMin(value = "0.0", inclusive = false, message = "La capacidad debe ser mayor que cero")
    @Digits(integer = 3, fraction = 2, message = "La capacidad no tiene un formato válido")
    private BigDecimal tankCapacity;
    @DecimalMin(value = "0.0", inclusive = false, message = "El consumo oficial debe ser mayor que cero")
    @Digits(integer = 3, fraction = 2, message = "El consumo oficial no tiene un formato válido")
    private BigDecimal officialConsumption;
    private Boolean isPublic;
    private Boolean showFuelData;
    private Boolean showExpenses;
    private Boolean showStatistics;

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

    public Boolean getIsPublic() {
        return isPublic;
    }

    public void setIsPublic(Boolean isPublic) {
        this.isPublic = isPublic;
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

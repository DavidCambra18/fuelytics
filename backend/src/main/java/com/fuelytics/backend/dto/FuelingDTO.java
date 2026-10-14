package com.fuelytics.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.fuelytics.backend.entity.enums.DrivingType;
import com.fuelytics.backend.entity.enums.FuelType;
import com.fuelytics.backend.entity.enums.RefuelingType;
import com.fuelytics.backend.entity.enums.TireType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class FuelingDTO {

    @NotNull(message = "El vehículo es obligatorio")
    private Integer vehicleId;
    @NotNull(message = "La fecha es obligatoria")
    private LocalDate date;
    @PositiveOrZero(message = "El odómetro no puede ser negativo")
    private Integer odometer;
    @NotNull(message = "El tipo de repostaje es obligatorio")
    private RefuelingType refueling;
    @NotNull(message = "El combustible es obligatorio")
    private FuelType fuelType;
    @NotNull(message = "La distancia es obligatoria")
    @PositiveOrZero(message = "La distancia no puede ser negativa")
    @Digits(integer = 4, fraction = 2, message = "La distancia no tiene un formato válido")
    private BigDecimal distance;
    @NotNull(message = "La cantidad es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad debe ser mayor que cero")
    @Digits(integer = 4, fraction = 2, message = "La cantidad no tiene un formato válido")
    private BigDecimal liters;
    @NotNull(message = "El importe es obligatorio")
    @PositiveOrZero(message = "El importe no puede ser negativo")
    @Digits(integer = 6, fraction = 2, message = "El importe no tiene un formato válido")
    private BigDecimal priceTotal;
    @NotNull(message = "El tipo de conducción es obligatorio")
    private DrivingType drivingType;
    @NotNull(message = "El tipo de neumático es obligatorio")
    private TireType tireType;
    private Boolean highway;
    private Boolean city;
    private Boolean road;
    private Boolean ac;
    private Boolean trailer;
    private Boolean heating;
    @PositiveOrZero(message = "El consumo del ordenador no puede ser negativo")
    @Digits(integer = 3, fraction = 2, message = "El consumo del ordenador no tiene un formato válido")
    private BigDecimal boardConsumption;
    @PositiveOrZero(message = "La velocidad media no puede ser negativa")
    @Max(value = 500, message = "La velocidad media no puede superar 500")
    private Integer averageSpeed;
    @Size(max = 5000, message = "Las notas no pueden superar 5000 caracteres")
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

    public Boolean getHeating() {
        return heating;
    }

    public void setHeating(Boolean heating) {
        this.heating = heating;
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

package com.fuelytics.backend.entity;

import java.math.BigDecimal;
import java.time.LocalDate;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fuelytics.backend.entity.enums.DrivingType;
import com.fuelytics.backend.entity.enums.FuelType;
import com.fuelytics.backend.entity.enums.RefuelingType;
import com.fuelytics.backend.entity.enums.TireType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "fuel_entries")
public class FuelEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = true)
    private Integer odometer;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "refueling", columnDefinition = "refueling_type", nullable = false)
    private RefuelingType refueling;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "fuel_type", columnDefinition = "fuel_type", nullable = false)
    private FuelType fuelType;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal distance;

    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal liters;

    @Column(name = "price_total", nullable = false, precision = 8, scale = 2)
    private BigDecimal priceTotal;

    @Column(name = "price_per_liter", nullable = false, precision = 5, scale = 3)
    private BigDecimal pricePerLiter;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "driving_type", columnDefinition = "driving_type", nullable = false)
    private DrivingType drivingType;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "tire_type", columnDefinition = "tire_type", nullable = false)
    private TireType tireType;

    @Column(nullable = false)
    private Boolean highway = false;

    @Column(nullable = false)
    private Boolean city = false;

    @Column(nullable = false)
    private Boolean road = false;

    @Column(nullable = false)
    private Boolean ac = false;

    @Column(nullable = false)
    private Boolean trailer = false;

    @Column(nullable = false)
    private Boolean heating = false;

    @Column(name = "board_consumption")
    private BigDecimal boardConsumption;

    @Column(name = "average_speed")
    private Integer averageSpeed;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
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

    public BigDecimal getPricePerLiter() {
        return pricePerLiter;
    }

    public void setPricePerLiter(BigDecimal pricePerLiter) {
        this.pricePerLiter = pricePerLiter;
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
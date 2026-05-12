package com.fuelytics.backend.entity;

import com.fuelytics.backend.entity.enums.*;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "vehicles")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "vehicle_type", columnDefinition = "vehicle_type")
    private VehicleType vehicleType;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private int power;

    private int cc;

    @Column(nullable = false)
    private int year;

    private Integer odometer;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "fuel_type", columnDefinition = "fuel_type")
    private FuelType fuelType;

    @Column(name = "tank_capacity", nullable = false)
    private BigDecimal tankCapacity;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "gearbox", columnDefinition = "gearbox_type")
    private GearboxType gearbox;

    @Column(name = "official_consumption")
    private BigDecimal officialConsumption;

    private Boolean isPublic = false;
    private Boolean showFuelData = true;
    private Boolean showExpenses = false;
    private Boolean showStatistics = true;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
package com.fuelytics.backend.entity;

import java.time.LocalDate;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.fuelytics.backend.entity.enums.TireAxle;

import jakarta.persistence.*;

@Entity
@Table(name = "tire_sets")
public class TireSet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @Column(nullable = false)
    private String brand;

    @Column(nullable = false)
    private String model;

    @Column(nullable = false)
    private String size;

    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "axle", columnDefinition = "tire_axle_enum")
    private TireAxle axle;

    @Column(name = "installation_date", nullable = false)
    private LocalDate installationDate;

    @Column(name = "installation_odometer", nullable = false)
    private int installationOdometer;

    @Column(name = "removal_odometer")
    private Integer removalOdometer;

    @Column(name = "is_active", nullable = false)
    private boolean active;

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

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public TireAxle getAxle() {
        return axle;
    }

    public void setAxle(TireAxle axle) {
        this.axle = axle;
    }

    public LocalDate getInstallationDate() {
        return installationDate;
    }

    public void setInstallationDate(LocalDate installationDate) {
        this.installationDate = installationDate;
    }

    public int getInstallationOdometer() {
        return installationOdometer;
    }

    public void setInstallationOdometer(int installationOdometer) {
        this.installationOdometer = installationOdometer;
    }

    public Integer getRemovalOdometer() {
        return removalOdometer;
    }

    public void setRemovalOdometer(Integer removalOdometer) {
        this.removalOdometer = removalOdometer;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }
}
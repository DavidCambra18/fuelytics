package com.fuelytics.backend.dto;

import java.time.LocalDate;
import com.fuelytics.backend.entity.enums.TireAxle;

public class TireSetResponseDTO {

    private Integer id;
    private String brand;
    private String model;
    private String size;
    private TireAxle axle;
    private LocalDate installationDate;
    private Integer installationOdometer;
    private Integer removalOdometer;
    private boolean active;
    private Integer currentKm;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
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

    public Integer getInstallationOdometer() {
        return installationOdometer;
    }

    public void setInstallationOdometer(Integer installationOdometer) {
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

    public Integer getCurrentKm() {
        return currentKm;
    }

    public void setCurrentKm(Integer currentKm) {
        this.currentKm = currentKm;
    }
}
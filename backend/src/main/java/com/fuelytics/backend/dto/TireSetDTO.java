package com.fuelytics.backend.dto;

import java.time.LocalDate;
import com.fuelytics.backend.entity.enums.TireAxle;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public class TireSetDTO {

    @NotBlank(message = "La marca es obligatoria")
    @Size(max = 100, message = "La marca no puede superar 100 caracteres")
    private String brand;
    @NotBlank(message = "El modelo es obligatorio")
    @Size(max = 100, message = "El modelo no puede superar 100 caracteres")
    private String model;
    @NotBlank(message = "La medida es obligatoria")
    @Size(max = 50, message = "La medida no puede superar 50 caracteres")
    private String size;
    @NotNull(message = "El eje es obligatorio")
    private TireAxle axle;
    @NotNull(message = "La fecha de instalación es obligatoria")
    private LocalDate installationDate;
    @NotNull(message = "El odómetro de instalación es obligatorio")
    @PositiveOrZero(message = "El odómetro de instalación no puede ser negativo")
    private Integer installationOdometer;

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
}

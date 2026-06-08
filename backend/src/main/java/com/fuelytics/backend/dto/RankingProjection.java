package com.fuelytics.backend.dto;

public interface RankingProjection {
    Integer getVehicleId();
    String getBrand();
    String getModel();
    String getUsername();
    Double getAvgConsumption();
}
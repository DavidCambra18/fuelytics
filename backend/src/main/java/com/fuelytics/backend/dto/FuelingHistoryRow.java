package com.fuelytics.backend.dto;
import java.math.BigDecimal;
public record FuelingHistoryRow(FuelingResponseDTO fueling, String displayState, BigDecimal displayConsumption) {}

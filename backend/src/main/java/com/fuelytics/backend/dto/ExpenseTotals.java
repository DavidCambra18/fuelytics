package com.fuelytics.backend.dto;
import java.math.BigDecimal;
import java.time.LocalDate;
public interface ExpenseTotals {
    BigDecimal getTotalCost();
    BigDecimal getYearlyCost();
    LocalDate getStartDate();
    LocalDate getEndDate();
}

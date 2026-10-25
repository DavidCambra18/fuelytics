package com.fuelytics.backend.service;
import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;
import com.fuelytics.backend.entity.enums.*;
class FuelingHistoryTest {
    @Test void pageContextPreservesPartialCyclesAndSameDayOrder() {
        var first = ReleaseCorrectionsTest.entry(1,"2026-01-01",RefuelingType.initial,"0","40","60");
        var partial = ReleaseCorrectionsTest.entry(2,"2026-01-01",RefuelingType.partial,"200","20","30");
        var complete = ReleaseCorrectionsTest.entry(3,"2026-01-01",RefuelingType.complete,"300","25","40");
        var rows = FuelingHistory.values(List.of(first,partial,complete),VehicleType.car);
        assertEquals("start",rows.get(1).state()); assertNull(rows.get(1).consumption());
        assertEquals("estimated",rows.get(2).state()); assertEquals("verified",rows.get(3).state());
        assertEquals(0, new BigDecimal("9").compareTo(rows.get(3).consumption()));
        assertEquals(0,new BigDecimal("0.09").compareTo(FuelingHistory.values(List.of(first,partial,complete),VehicleType.agricultural).get(3).consumption()));
    }
    @Test void measurementsNeverMixElectricityHydrogenGasAndLiquidFuel() {
        assertFalse(FuelingHistory.fuels(FuelType.diesel).contains(FuelType.electricity));
        assertFalse(FuelingHistory.fuels(FuelType.diesel).contains(FuelType.gnc));
        assertTrue(FuelingHistory.fuels(FuelType.diesel).contains(FuelType.gasoline_95));
        assertEquals(java.util.Set.of(FuelType.electricity),FuelingHistory.fuels(FuelType.electricity));
    }
}

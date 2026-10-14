package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.fuelytics.backend.entity.FuelEntry;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.entity.enums.FuelType;
import com.fuelytics.backend.entity.enums.RefuelingType;
import com.fuelytics.backend.entity.enums.VehicleEnergyType;
import com.fuelytics.backend.entity.enums.VehicleType;

class ConsumptionCalculatorTest {

    private final ConsumptionCalculator calculator = new ConsumptionCalculator();

    @Test
    void calculatesOnlyClosedFullTankCycles() {
        Vehicle vehicle = vehicle(VehicleEnergyType.diesel, VehicleType.car);

        var summary = calculator.calculate(List.of(
                entry(1, "2026-01-01", RefuelingType.initial, FuelType.diesel, "0", "45", "72"),
                entry(2, "2026-01-15", RefuelingType.partial, FuelType.diesel, "300", "20", "32"),
                entry(3, "2026-02-01", RefuelingType.complete, FuelType.diesel, "500", "40", "64"),
                entry(4, "2026-02-10", RefuelingType.partial, FuelType.diesel, "100", "10", "16")), vehicle);

        assertEquals(1, summary.verifiedCycles());
        assertEquals(new BigDecimal("800"), summary.verifiedDistance());
        assertEquals(new BigDecimal("60"), summary.verifiedQuantity());
        assertEquals(new BigDecimal("7.50"), summary.averageConsumption());
        assertEquals(new BigDecimal("12.00"), summary.costPerUnit());
        assertEquals(new BigDecimal("1.600"), summary.averageUnitPrice());
    }

    @Test
    void separatesElectricityFromLiquidFuelInPlugInVehicles() {
        Vehicle vehicle = vehicle(VehicleEnergyType.plug_in_hybrid_gasoline, VehicleType.car);

        var summary = calculator.calculate(List.of(
                entry(1, "2026-01-01", RefuelingType.initial, FuelType.gasoline_95, "0", "40", "60"),
                entry(2, "2026-01-05", RefuelingType.complete, FuelType.electricity, "100", "20", "5"),
                entry(3, "2026-01-10", RefuelingType.complete, FuelType.gasoline_95, "600", "36", "54")), vehicle);

        assertEquals(ConsumptionCalculator.Measurement.LIQUID, summary.measurement());
        assertEquals(1, summary.verifiedCycles());
        assertEquals(new BigDecimal("600"), summary.verifiedDistance());
        assertEquals(new BigDecimal("36"), summary.verifiedQuantity());
        assertEquals(new BigDecimal("6.00"), summary.averageConsumption());
    }

    @Test
    void usesPerHourFactorForAgriculturalVehicles() {
        Vehicle vehicle = vehicle(VehicleEnergyType.diesel, VehicleType.agricultural);

        var summary = calculator.calculate(List.of(
                entry(1, "2026-01-01", RefuelingType.complete, FuelType.diesel, "0", "20", "30"),
                entry(2, "2026-01-02", RefuelingType.complete, FuelType.diesel, "5", "15", "22.5")), vehicle);

        assertEquals(new BigDecimal("3.00"), summary.averageConsumption());
        assertEquals(new BigDecimal("4.50"), summary.costPerUnit());
    }

    private Vehicle vehicle(VehicleEnergyType energyType, VehicleType vehicleType) {
        Vehicle vehicle = new Vehicle();
        vehicle.setVehicleEnergyType(energyType);
        vehicle.setVehicleType(vehicleType);
        return vehicle;
    }

    private FuelEntry entry(
            int id,
            String date,
            RefuelingType refueling,
            FuelType fuelType,
            String distance,
            String quantity,
            String price) {
        FuelEntry entry = new FuelEntry();
        entry.setId(id);
        entry.setDate(LocalDate.parse(date));
        entry.setRefueling(refueling);
        entry.setFuelType(fuelType);
        entry.setDistance(new BigDecimal(distance));
        entry.setLiters(new BigDecimal(quantity));
        entry.setPriceTotal(new BigDecimal(price));
        return entry;
    }
}

package com.fuelytics.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Component;

import com.fuelytics.backend.entity.FuelEntry;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.entity.enums.FuelType;
import com.fuelytics.backend.entity.enums.RefuelingType;
import com.fuelytics.backend.entity.enums.VehicleEnergyType;
import com.fuelytics.backend.entity.enums.VehicleType;

@Component
public class ConsumptionCalculator {

    public ConsumptionSummary calculate(List<FuelEntry> entries, Vehicle vehicle) {
        Measurement measurement = measurementFor(vehicle.getVehicleEnergyType());
        List<FuelEntry> sorted = entries.stream()
                .filter(entry -> measurementFor(entry.getFuelType()) == measurement)
                .sorted(Comparator
                        .comparing(FuelEntry::getDate, Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(FuelEntry::getId, Comparator.nullsLast(Comparator.naturalOrder())))
                .toList();

        BigDecimal verifiedDistance = BigDecimal.ZERO;
        BigDecimal verifiedQuantity = BigDecimal.ZERO;
        BigDecimal verifiedCost = BigDecimal.ZERO;
        BigDecimal cycleDistance = BigDecimal.ZERO;
        BigDecimal cycleQuantity = BigDecimal.ZERO;
        BigDecimal cycleCost = BigDecimal.ZERO;
        int verifiedCycles = 0;
        boolean hasBaseline = false;

        for (FuelEntry entry : sorted) {
            RefuelingType type = entry.getRefueling();

            if (type == RefuelingType.initial || (!hasBaseline && type == RefuelingType.complete)) {
                hasBaseline = true;
                cycleDistance = BigDecimal.ZERO;
                cycleQuantity = BigDecimal.ZERO;
                cycleCost = BigDecimal.ZERO;
                continue;
            }

            if (!hasBaseline) {
                continue;
            }

            cycleDistance = cycleDistance.add(zeroIfNull(entry.getDistance()));
            cycleQuantity = cycleQuantity.add(zeroIfNull(entry.getLiters()));
            cycleCost = cycleCost.add(zeroIfNull(entry.getPriceTotal()));

            if (type == RefuelingType.complete && cycleDistance.signum() > 0) {
                verifiedDistance = verifiedDistance.add(cycleDistance);
                verifiedQuantity = verifiedQuantity.add(cycleQuantity);
                verifiedCost = verifiedCost.add(cycleCost);
                verifiedCycles++;
                cycleDistance = BigDecimal.ZERO;
                cycleQuantity = BigDecimal.ZERO;
                cycleCost = BigDecimal.ZERO;
            }
        }

        int factor = vehicle.getVehicleType() == VehicleType.agricultural ? 1 : 100;
        BigDecimal averageConsumption = divide(verifiedQuantity.multiply(BigDecimal.valueOf(factor)), verifiedDistance, 2);
        BigDecimal costPerUnit = divide(verifiedCost.multiply(BigDecimal.valueOf(factor)), verifiedDistance, 2);
        BigDecimal averageUnitPrice = divide(verifiedCost, verifiedQuantity, 3);

        return new ConsumptionSummary(
                measurement,
                verifiedCycles,
                verifiedDistance,
                verifiedQuantity,
                verifiedCost,
                averageConsumption,
                costPerUnit,
                averageUnitPrice);
    }

    private Measurement measurementFor(VehicleEnergyType energyType) {
        if (energyType == VehicleEnergyType.electric) {
            return Measurement.ELECTRICITY;
        }
        if (energyType == VehicleEnergyType.hydrogen) {
            return Measurement.HYDROGEN;
        }
        return Measurement.LIQUID;
    }

    private Measurement measurementFor(FuelType fuelType) {
        if (fuelType == FuelType.electricity) {
            return Measurement.ELECTRICITY;
        }
        if (fuelType == FuelType.hydrogen) {
            return Measurement.HYDROGEN;
        }
        return Measurement.LIQUID;
    }

    private BigDecimal divide(BigDecimal numerator, BigDecimal denominator, int scale) {
        if (denominator.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return numerator.divide(denominator, scale, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    public enum Measurement {
        LIQUID,
        ELECTRICITY,
        HYDROGEN
    }

    public record ConsumptionSummary(
            Measurement measurement,
            int verifiedCycles,
            BigDecimal verifiedDistance,
            BigDecimal verifiedQuantity,
            BigDecimal verifiedCost,
            BigDecimal averageConsumption,
            BigDecimal costPerUnit,
            BigDecimal averageUnitPrice) {
    }
}

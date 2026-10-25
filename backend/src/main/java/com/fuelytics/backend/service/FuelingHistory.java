package com.fuelytics.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import com.fuelytics.backend.entity.FuelEntry;
import com.fuelytics.backend.entity.enums.*;

final class FuelingHistory {
    record Value(String state, BigDecimal consumption) {}
    static Set<FuelType> fuels(FuelType type) {
        if (type == FuelType.electricity || type == FuelType.hydrogen || type == FuelType.gnc) return Set.of(type);
        var liquids = EnumSet.allOf(FuelType.class);
        liquids.removeAll(Set.of(FuelType.electricity, FuelType.hydrogen, FuelType.gnc));
        return liquids;
    }
    static Map<Integer, Value> values(List<FuelEntry> entries, VehicleType vehicleType) {
        var result = new HashMap<Integer, Value>();
        boolean baseline = false;
        BigDecimal distance = BigDecimal.ZERO, quantity = BigDecimal.ZERO;
        int factor = vehicleType == VehicleType.agricultural ? 1 : 100;
        for (FuelEntry entry : entries) {
            if (entry.getRefueling() == RefuelingType.initial || (!baseline && entry.getRefueling() == RefuelingType.complete)) {
                baseline = true; distance = BigDecimal.ZERO; quantity = BigDecimal.ZERO;
                result.put(entry.getId(), new Value("start", null));
            } else if (!baseline) {
                result.put(entry.getId(), new Value("partial", null));
            } else {
                distance = distance.add(entry.getDistance() == null ? BigDecimal.ZERO : entry.getDistance());
                quantity = quantity.add(entry.getLiters() == null ? BigDecimal.ZERO : entry.getLiters());
                BigDecimal consumption = distance.signum() > 0 ? quantity.multiply(BigDecimal.valueOf(factor)).divide(distance, 12, RoundingMode.HALF_UP) : null;
                boolean closed = entry.getRefueling() == RefuelingType.complete && distance.signum() > 0;
                result.put(entry.getId(), new Value(closed ? "verified" : "estimated", consumption));
                if (closed) { distance = BigDecimal.ZERO; quantity = BigDecimal.ZERO; }
            }
        }
        return result;
    }
}

package com.fuelytics.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fuelytics.backend.entity.TireSet;

public interface TireSetRepository extends JpaRepository<TireSet, Integer> {
    List<TireSet> findByVehicleIdOrderByInstallationDateDesc(Integer vehicleId);
    List<TireSet> findByVehicleIdAndActiveTrue(Integer vehicleId);
}
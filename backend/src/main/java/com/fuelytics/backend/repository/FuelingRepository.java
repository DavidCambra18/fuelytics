package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.fuelytics.backend.entity.FuelEntry;

@Repository
public interface FuelingRepository extends JpaRepository<FuelEntry, Integer> {
    
    List<FuelEntry> findByVehicleIdOrderByDateDesc(Integer vehicleId);
    
}
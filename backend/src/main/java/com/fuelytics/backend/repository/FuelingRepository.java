package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fuelytics.backend.entity.FuelEntry;

@Repository
public interface FuelingRepository extends JpaRepository<FuelEntry, Integer> {
    
        @Query("SELECT f FROM FuelEntry f WHERE f.vehicle.id = :vehicleId ORDER BY f.date DESC")
        List<FuelEntry> findByVehicleIdOrderByDateDesc(@Param("vehicleId") Integer vehicleId);
    
}
package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.fuelytics.backend.entity.FuelEntry;

@Repository
public interface FuelingRepository extends JpaRepository<FuelEntry, Integer> {

        boolean existsByVehicleId(Integer vehicleId);
    
        @Query("SELECT f FROM FuelEntry f WHERE f.vehicle.id = :vehicleId ORDER BY f.date DESC")
        List<FuelEntry> findByVehicleIdOrderByDateDesc(@Param("vehicleId") Integer vehicleId);

        @Query("SELECT MAX(f.odometer) FROM FuelEntry f WHERE f.vehicle.id = :vehicleId")
        Integer findMaxOdometerByVehicleId(@Param("vehicleId") Integer vehicleId);
    

    org.springframework.data.domain.Page<FuelEntry> findByVehicleId(Integer vehicleId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT new com.fuelytics.backend.dto.HistoryDateRange(MIN(f.date), MAX(f.date)) FROM FuelEntry f WHERE f.vehicle.id = :vehicleId")
    com.fuelytics.backend.dto.HistoryDateRange dateRange(@Param("vehicleId") Integer vehicleId);

    @Query("SELECT f FROM FuelEntry f WHERE f.vehicle.id = :vehicleId AND f.fuelType IN :fuels "
            + "AND f.refueling IN :boundaries AND (f.date < :date OR (f.date = :date AND f.id < :id)) "
            + "ORDER BY f.date DESC, f.id DESC")
    List<FuelEntry> previousBaseline(@Param("vehicleId") Integer vehicleId,
            @Param("fuels") java.util.Set<com.fuelytics.backend.entity.enums.FuelType> fuels,
            @Param("boundaries") java.util.Set<com.fuelytics.backend.entity.enums.RefuelingType> boundaries,
            @Param("date") java.time.LocalDate date, @Param("id") Integer id,
            org.springframework.data.domain.Pageable pageable);

    @Query("SELECT f FROM FuelEntry f WHERE f.vehicle.id = :vehicleId AND f.fuelType IN :fuels "
            + "AND (f.date > :startDate OR (f.date = :startDate AND f.id >= :startId)) "
            + "AND (f.date < :endDate OR (f.date = :endDate AND f.id <= :endId)) ORDER BY f.date, f.id")
    List<FuelEntry> cycleContext(@Param("vehicleId") Integer vehicleId,
            @Param("fuels") java.util.Set<com.fuelytics.backend.entity.enums.FuelType> fuels,
            @Param("startDate") java.time.LocalDate startDate, @Param("startId") Integer startId,
            @Param("endDate") java.time.LocalDate endDate, @Param("endId") Integer endId);


    interface VehicleOdometer { Integer getVehicleId(); Integer getOdometer(); }
    @Query("SELECT f.vehicle.id AS vehicleId, MAX(f.odometer) AS odometer FROM FuelEntry f WHERE f.vehicle.user.id = :userId GROUP BY f.vehicle.id")
    List<VehicleOdometer> maxOdometersForUser(@Param("userId") Integer userId);
}

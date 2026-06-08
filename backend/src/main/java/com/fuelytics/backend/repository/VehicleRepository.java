package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.dto.RankingProjection; 

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    List<Vehicle> findByUserId(Integer userId);

    @Query(value = "SELECT v.id AS vehicleId, v.brand AS brand, v.model AS model, u.username AS username, " +
                   "v.avg_consumption AS avgConsumption " +
                   "FROM vehicles v " +
                   "JOIN users u ON v.user_id = u.id " +
                   "WHERE v.is_public = true " +
                   "AND v.show_fuel_data = true " +
                   "AND u.profile_public = true " +
                   "AND v.vehicle_type != 'agricultural' " +
                   "AND v.vehicle_energy_type != 'electric' " +
                   "AND v.avg_consumption IS NOT NULL " +
                   "ORDER BY v.avg_consumption ASC", nativeQuery = true)
    List<RankingProjection> getGlobalRanking();
}
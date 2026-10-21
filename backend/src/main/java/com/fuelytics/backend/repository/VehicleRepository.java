package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.dto.RankingProjection; 

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    List<Vehicle> findByUserId(Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Vehicle v WHERE v.id = :id")
    Optional<Vehicle> findByIdForUpdate(@Param("id") Integer id);

    @Query(value = "SELECT v.id AS vehicleId, v.brand AS brand, v.model AS model, u.username AS username, " +
                   "v.avg_consumption AS avgConsumption " +
                   "FROM vehicles v " +
                   "JOIN users u ON v.user_id = u.id " +
                   "WHERE v.is_public = true " +
                   "AND v.show_fuel_data = true " +
                   "AND v.show_statistics = true " +
                   "AND u.profile_public = true " +
                   "AND v.vehicle_type != 'agricultural' " +
                   "AND v.vehicle_energy_type IN ('gasoline', 'diesel', 'hybrid_gasoline', 'hybrid_diesel', " +
                   "'plug_in_hybrid_gasoline', 'plug_in_hybrid_diesel', 'glp', 'ethanol') " +
                   "AND v.avg_consumption IS NOT NULL " +
                   "ORDER BY v.avg_consumption ASC, v.id ASC", nativeQuery = true)
    List<RankingProjection> getGlobalRanking();

    @Query(value = "SELECT v.id AS vehicleId, v.brand AS brand, v.model AS model, u.username AS username, " +
                   "v.avg_consumption AS avgConsumption " +
                   "FROM vehicles v " +
                   "JOIN users u ON v.user_id = u.id " +
                   "WHERE v.is_public = true " +
                   "AND v.show_fuel_data = true " +
                   "AND v.show_statistics = true " +
                   "AND u.profile_public = true " +
                   "AND v.vehicle_type != 'agricultural' " +
                   "AND v.vehicle_energy_type IN ('gasoline', 'diesel', 'hybrid_gasoline', 'hybrid_diesel', " +
                   "'plug_in_hybrid_gasoline', 'plug_in_hybrid_diesel', 'glp', 'ethanol') " +
                   "AND v.avg_consumption IS NOT NULL " +
                   "AND (u.id = :userId OR EXISTS (" +
                   "SELECT 1 FROM friendships f " +
                   "WHERE f.status = 'ACCEPTED' " +
                   "AND ((f.requester_id = :userId AND f.addressee_id = u.id) " +
                   "OR (f.addressee_id = :userId AND f.requester_id = u.id)))) " +
                   "ORDER BY v.avg_consumption ASC, v.id ASC", nativeQuery = true)
    List<RankingProjection> getFriendsRanking(@Param("userId") Integer userId);
}

package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fuelytics.backend.entity.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    @Query("SELECT e FROM Expense e WHERE e.vehicle.id = :vehicleId ORDER BY e.date DESC")
    List<Expense> findByVehicleIdOrderByDateDesc(@Param("vehicleId") Integer vehicleId);

    org.springframework.data.domain.Page<Expense> findByVehicleId(Integer vehicleId, org.springframework.data.domain.Pageable pageable);

    @Query("SELECT SUM(e.cost) AS totalCost, MIN(e.date) AS startDate, MAX(e.date) AS endDate, "
            + "SUM(CASE WHEN e.date >= :yearStart AND e.date < :yearEnd THEN e.cost ELSE 0 END) AS yearlyCost "
            + "FROM Expense e WHERE e.vehicle.id = :vehicleId")
    com.fuelytics.backend.dto.ExpenseTotals totals(@Param("vehicleId") Integer vehicleId,
            @Param("yearStart") java.time.LocalDate yearStart, @Param("yearEnd") java.time.LocalDate yearEnd);

}

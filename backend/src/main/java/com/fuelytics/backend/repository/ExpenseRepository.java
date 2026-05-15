package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fuelytics.backend.entity.Expense;

public interface ExpenseRepository extends JpaRepository<Expense, Integer> {

    @Query("SELECT e FROM Expense e WHERE e.vehicle.id = :vehicleId ORDER BY e.date DESC")
    List<Expense> findByVehicleIdOrderByDateDesc(@Param("vehicleId") Integer vehicleId);
}

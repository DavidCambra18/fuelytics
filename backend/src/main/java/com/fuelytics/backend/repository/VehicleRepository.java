package com.fuelytics.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fuelytics.backend.entity.Vehicle;

public interface VehicleRepository extends JpaRepository<Vehicle, Integer> {

    List<Vehicle> findByUserId(Integer userId);
}
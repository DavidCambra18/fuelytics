package com.fuelytics.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.fuelytics.backend.dto.RankingProjection;
import com.fuelytics.backend.repository.VehicleRepository;

@Service
public class RankingService {

    private final VehicleRepository vehicleRepository;

    public RankingService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    public List<RankingProjection> getGlobalRanking() {
        return vehicleRepository.getGlobalRanking();
    }
}
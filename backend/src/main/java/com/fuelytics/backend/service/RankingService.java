package com.fuelytics.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.fuelytics.backend.dto.RankingProjection;
import com.fuelytics.backend.repository.VehicleRepository;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.entity.User;

@Service
public class RankingService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public RankingService(VehicleRepository vehicleRepository, UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    public List<RankingProjection> getGlobalRanking() {
        return vehicleRepository.getGlobalRanking();
    }

    public List<RankingProjection> getFriendsRanking(String email) {
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Usuario no encontrado");
        }
        return vehicleRepository.getFriendsRanking(user.getId());
    }
}

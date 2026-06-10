package com.fuelytics.backend.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fuelytics.backend.dto.UserBadgeResponseDTO;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.entity.UserBadge;
import com.fuelytics.backend.entity.Vehicle;
import com.fuelytics.backend.entity.enums.ExpenseType;
import com.fuelytics.backend.repository.BadgeRepository;
import com.fuelytics.backend.repository.ExpenseRepository;
import com.fuelytics.backend.repository.FuelingRepository;
import com.fuelytics.backend.repository.UserBadgeRepository;
import com.fuelytics.backend.repository.UserRepository;

@Service
public class BadgeService {

    private final UserBadgeRepository userBadgeRepository;
    private final BadgeRepository badgeRepository;
    private final FuelingRepository fuelingRepository;
    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    public BadgeService(UserBadgeRepository userBadgeRepository,
            BadgeRepository badgeRepository,
            FuelingRepository fuelingRepository,
            ExpenseRepository expenseRepository,
            UserRepository userRepository) {
        this.userBadgeRepository = userBadgeRepository;
        this.badgeRepository = badgeRepository;
        this.fuelingRepository = fuelingRepository;
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    public void checkFuelingBadges(User user, Vehicle vehicle) {
        long fuelingCount = fuelingRepository.findByVehicleIdOrderByDateDesc(vehicle.getId()).size();

        if (fuelingCount >= 10) {
            awardBadgeIfNotExists(user, vehicle, 1);
        }

        if (fuelingCount >= 5 && vehicle.getAvgConsumption() != null && vehicle.getAvgConsumption() <= 5.0) {
            awardBadgeIfNotExists(user, vehicle, 3);
        }
    }

    public void checkExpenseBadges(User user, Vehicle vehicle) {
        var expenses = expenseRepository.findByVehicleIdOrderByDateDesc(vehicle.getId());

        if (expenses.size() >= 10) {
            awardBadgeIfNotExists(user, vehicle, 2);
        }

        long maintenanceCount = expenses.stream()
                .filter(e -> e.getType() == ExpenseType.maintenance || e.getType() == ExpenseType.tire_change)
                .count();

        if (maintenanceCount >= 5) {
            awardBadgeIfNotExists(user, vehicle, 4);
        }
    }

    private void awardBadgeIfNotExists(User user, Vehicle vehicle, Integer badgeId) {
        if (!userBadgeRepository.existsByUserIdAndBadgeId(user.getId(), badgeId)) {
            badgeRepository.findById(badgeId).ifPresent(badge -> {
                UserBadge userBadge = new UserBadge();
                userBadge.setUser(user);
                userBadge.setBadge(badge);
                userBadge.setVehicle(vehicle);
                userBadge.setEarnedDate(LocalDate.now());
                userBadgeRepository.save(userBadge);
            });
        }
    }

    public List<UserBadgeResponseDTO> getUserBadges(String email) {
        User user = userRepository.findByEmail(email);

        return userBadgeRepository.findByUserId(user.getId())
                .stream()
                .map(ub -> {
                    UserBadgeResponseDTO dto = new UserBadgeResponseDTO();
                    dto.setName(ub.getBadge().getName());
                    dto.setDescription(ub.getBadge().getDescription());
                    dto.setIconName(ub.getBadge().getIconName());
                    dto.setEarnedDate(ub.getEarnedDate());
                    return dto;
                })
                .toList();
    }

    public List<UserBadgeResponseDTO> getUserBadgesByUsername(String username) {
    User user = userRepository.findByUsername(username);
    if (user == null) return List.of();
    
    return userBadgeRepository.findByUserId(user.getId())
            .stream()
            .map(ub -> {
                UserBadgeResponseDTO dto = new UserBadgeResponseDTO();
                dto.setName(ub.getBadge().getName());
                dto.setDescription(ub.getBadge().getDescription());
                dto.setIconName(ub.getBadge().getIconName());
                dto.setEarnedDate(ub.getEarnedDate());
                return dto;
            })
            .toList();
}
}
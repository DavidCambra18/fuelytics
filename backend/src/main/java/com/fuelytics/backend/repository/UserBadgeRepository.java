package com.fuelytics.backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.fuelytics.backend.entity.UserBadge;

@Repository
public interface UserBadgeRepository extends JpaRepository<UserBadge, Integer> {
    List<UserBadge> findByUserId(Integer userId);

    // Sirve para evitar otorgar el mismo logro más de una vez
    boolean existsByUserIdAndBadgeId(Integer userId, Integer badgeId);
}
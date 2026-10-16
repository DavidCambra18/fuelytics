package com.fuelytics.backend.repository;

import java.util.List;

import com.fuelytics.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Pageable;
import jakarta.persistence.LockModeType;

public interface UserRepository extends JpaRepository<User, Integer> {

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByUsernameAndIdNot(String username, Integer id);

    User findByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM User u WHERE u.email = :email")
    User findByEmailForUpdate(@Param("email") String email);

    User findByUsername(String username);

    @Query("SELECT u FROM User u "
            + "WHERE u.id != :currentUserId "
            + "AND LOCATE(LOWER(:username), LOWER(u.username)) > 0 "
            + "ORDER BY u.username")
    List<User> searchByUsername(
            @Param("username") String username,
            @Param("currentUserId") Integer currentUserId,
            Pageable pageable);
}

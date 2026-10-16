package com.fuelytics.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fuelytics.backend.entity.Friendship;

import jakarta.persistence.LockModeType;

public interface FriendshipRepository extends JpaRepository<Friendship, Integer> {

    @Query("SELECT f FROM Friendship f "
            + "JOIN FETCH f.requester JOIN FETCH f.addressee "
            + "WHERE f.requester.id = :userId OR f.addressee.id = :userId "
            + "ORDER BY f.updatedAt DESC")
    List<Friendship> findAllForUser(@Param("userId") Integer userId);

    @Query("SELECT f FROM Friendship f "
            + "JOIN FETCH f.requester JOIN FETCH f.addressee "
            + "WHERE (f.requester.id = :firstUserId AND f.addressee.id = :secondUserId) "
            + "OR (f.requester.id = :secondUserId AND f.addressee.id = :firstUserId)")
    Optional<Friendship> findBetweenUsers(
            @Param("firstUserId") Integer firstUserId,
            @Param("secondUserId") Integer secondUserId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Friendship f "
            + "WHERE (f.requester.id = :firstUserId AND f.addressee.id = :secondUserId) "
            + "OR (f.requester.id = :secondUserId AND f.addressee.id = :firstUserId)")
    Optional<Friendship> findBetweenUsersForUpdate(
            @Param("firstUserId") Integer firstUserId,
            @Param("secondUserId") Integer secondUserId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM Friendship f "
            + "WHERE f.id = :id")
    Optional<Friendship> findByIdForUpdate(@Param("id") Integer id);
}

package com.fuelytics.backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.fuelytics.backend.entity.GoogleAccount;

public interface GoogleAccountRepository extends JpaRepository<GoogleAccount, Integer> {
    Optional<GoogleAccount> findByGoogleSubject(String googleSubject);
}

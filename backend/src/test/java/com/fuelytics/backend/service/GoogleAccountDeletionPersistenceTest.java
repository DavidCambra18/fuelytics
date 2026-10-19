package com.fuelytics.backend.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import com.fuelytics.backend.entity.GoogleAccount;
import com.fuelytics.backend.entity.User;
import com.fuelytics.backend.repository.GoogleAccountRepository;
import com.fuelytics.backend.repository.UserRepository;
import com.fuelytics.backend.security.GoogleIdentity;
import com.fuelytics.backend.security.JwtService;
import jakarta.validation.Validation;

class GoogleAccountDeletionPersistenceTest {
    @Test
    void deletesGoogleAccountWithRealHibernatePersistenceWithoutTouchingOtherUsers() {
        // Isolated in-memory database: never uses the application's datasource or real users.
        try (var factory = new Configuration().addAnnotatedClass(User.class).addAnnotatedClass(GoogleAccount.class)
                .setProperty("hibernate.connection.url", "jdbc:h2:mem:google_deletion;DB_CLOSE_DELAY=-1")
                .setProperty("hibernate.hbm2ddl.auto", "create-drop")
                .buildSessionFactory();
             var entityManager = factory.createEntityManager();
             var validation = Validation.buildDefaultValidatorFactory()) {
            entityManager.getTransaction().begin();
            User owner = user("owner");
            User other = user("other");
            entityManager.persist(owner);
            entityManager.persist(other);
            entityManager.persist(new GoogleAccount(owner, "owner-subject"));
            entityManager.persist(new GoogleAccount(other, "other-subject"));
            entityManager.getTransaction().commit();
            entityManager.clear();

            var repositories = new JpaRepositoryFactory(entityManager);
            var service = new GoogleAccountService(repositories.getRepository(UserRepository.class),
                    repositories.getRepository(GoogleAccountRepository.class), mock(JwtService.class),
                    new BCryptPasswordEncoder(), mock(ApplicationEventPublisher.class), validation.getValidator());
            entityManager.getTransaction().begin();
            service.deleteAccount(owner.getEmail(), new GoogleIdentity("owner-subject", owner.getEmail(), null, null));
            entityManager.getTransaction().commit();
            entityManager.clear();
            assertNull(entityManager.find(User.class, owner.getId()));
            assertNull(entityManager.find(GoogleAccount.class, owner.getId()));
            assertNotNull(entityManager.find(User.class, other.getId()));
            assertNotNull(entityManager.find(GoogleAccount.class, other.getId()));
        }
    }

    private User user(String name) {
        User user = new User();
        user.setUsername(name);
        user.setEmail(name + "@example.com");
        return user;
    }
}

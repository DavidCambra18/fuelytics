package com.fuelytics.backend.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.event.TransactionalEventListenerFactory;

class NotificationMailListenerTest {
    private final NotificationMailProperties enabled = new NotificationMailProperties(
            true, "app@example.com", "Fuelytics", "https://fuelytics.example");
    private final NotificationMailService service = mock(NotificationMailService.class);
    private final MailNotification notification = MailNotification.welcome("new@example.com", "usuario");

    @Test
    void sendsOnlyAfterCommitAndSkipsRollbackAndEventsOutsideTransactions() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(TransactionalEventListenerFactory.class);
            context.registerBean(NotificationMailListener.class,
                    () -> new NotificationMailListener(enabled, service, Runnable::run));
            context.refresh();
            var transaction = new TransactionTemplate(new TestTransactionManager());

            context.publishEvent(notification);
            verifyNoInteractions(service);
            transaction.executeWithoutResult(status -> {
                context.publishEvent(notification);
                verifyNoInteractions(service);
                status.setRollbackOnly();
            });
            verifyNoInteractions(service);
            transaction.executeWithoutResult(status -> {
                context.publishEvent(notification);
                verifyNoInteractions(service);
            });
            verify(service).send(notification);
        }
    }

    @Test
    void fullQueueDoesNotFailAlreadyCommittedOperation() {
        Executor fullQueue = task -> { throw new RejectedExecutionException(); };
        assertDoesNotThrow(() -> new NotificationMailListener(enabled, service, fullQueue).afterCommit(notification));
        verifyNoInteractions(service);
    }

    @Test
    void disabledNotificationsAreNotQueued() {
        Executor executor = mock(Executor.class);
        new NotificationMailListener(new NotificationMailProperties(false, "", "", ""), service, executor)
                .afterCommit(notification);
        verifyNoInteractions(service, executor);
    }

    private static class TestTransactionManager extends AbstractPlatformTransactionManager {
        @Override protected Object doGetTransaction() { return new Object(); }
        @Override protected void doBegin(Object transaction, TransactionDefinition definition) { }
        @Override protected void doCommit(DefaultTransactionStatus status) { }
        @Override protected void doRollback(DefaultTransactionStatus status) { }
    }
}

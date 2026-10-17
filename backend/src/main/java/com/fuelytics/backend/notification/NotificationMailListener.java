package com.fuelytics.backend.notification;

import java.util.concurrent.Executor;
import java.util.concurrent.RejectedExecutionException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class NotificationMailListener {
    private static final Logger log = LoggerFactory.getLogger(NotificationMailListener.class);
    private final NotificationMailProperties properties;
    private final NotificationMailService mailService;
    private final Executor executor;

    public NotificationMailListener(NotificationMailProperties properties, NotificationMailService mailService,
            @Qualifier("notificationMailExecutor") Executor executor) {
        this.properties = properties;
        this.mailService = mailService;
        this.executor = executor;
    }

    @TransactionalEventListener
    public void afterCommit(MailNotification notification) {
        if (!properties.enabled()) return;
        try {
            executor.execute(() -> mailService.send(notification));
        } catch (RejectedExecutionException exception) {
            log.warn("Correo {} omitido: la cola SMTP está llena o detenida", notification.type());
        }
    }
}

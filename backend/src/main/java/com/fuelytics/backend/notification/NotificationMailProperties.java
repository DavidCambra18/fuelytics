package com.fuelytics.backend.notification;

import java.net.URI;
import jakarta.mail.internet.InternetAddress;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.mail")
public record NotificationMailProperties(boolean enabled, String from, String fromName, String frontendUrl) {
    public NotificationMailProperties {
        if (enabled) {
            try {
                InternetAddress address = new InternetAddress(from, true);
                address.validate();
                URI uri = URI.create(frontendUrl);
                if (!("https".equals(uri.getScheme()) || "http".equals(uri.getScheme()))
                        || uri.getHost() == null || uri.getUserInfo() != null
                        || uri.getQuery() != null || uri.getFragment() != null) {
                    throw new IllegalArgumentException();
                }
                if (fromName == null || fromName.isBlank() || fromName.contains("\r") || fromName.contains("\n")) {
                    throw new IllegalArgumentException();
                }
            } catch (Exception exception) {
                throw new IllegalArgumentException("Configura MAIL_FROM, MAIL_FROM_NAME y MAIL_FRONTEND_URL correctamente");
            }
        }
    }
}

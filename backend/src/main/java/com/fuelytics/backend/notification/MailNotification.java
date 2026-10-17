package com.fuelytics.backend.notification;

// Immutable snapshots avoid accessing JPA entities after the transaction has finished.
public record MailNotification(Type type, String recipient, String username, String requesterUsername) {
    public enum Type { WELCOME, FRIEND_REQUEST }

    public static MailNotification welcome(String email, String username) {
        return new MailNotification(Type.WELCOME, email, username, null);
    }

    public static MailNotification friendRequest(String email, String username, String requesterUsername) {
        return new MailNotification(Type.FRIEND_REQUEST, email, username, requesterUsername);
    }
}

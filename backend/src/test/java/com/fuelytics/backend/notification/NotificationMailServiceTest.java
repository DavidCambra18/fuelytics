package com.fuelytics.backend.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.Properties;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

class NotificationMailServiceTest {
    @SuppressWarnings("unchecked")
    private final ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
    private final JavaMailSender sender = mock(JavaMailSender.class);
    private final NotificationMailProperties enabled = new NotificationMailProperties(
            true, "fuelytics@example.com", "Fuelytics", "https://fuelytics.example/");

    @Test
    void disabledMailDoesNotAccessSmtp() {
        new NotificationMailService(new NotificationMailProperties(false, "", "", ""), provider)
                .send(MailNotification.welcome("recipient@example.com", "usuario"));
        verifyNoInteractions(provider, sender);
    }

    @Test
    void welcomeHasCorrectRecipientAndPlainAndHtmlAlternatives() throws Exception {
        prepareSender();
        new NotificationMailService(enabled, provider).send(MailNotification.welcome("new@example.com", "María"));
        MimeMessage message = sentMessage();
        assertEquals("Te damos la bienvenida a Fuelytics", message.getSubject());
        assertEquals("new@example.com", message.getAllRecipients()[0].toString());
        assertTrue(findText(message.getContent(), "text/plain").contains("Hola, María:"));
        assertTrue(findText(message.getContent(), "text/html").contains("https://fuelytics.example/dashboard"));
    }

    @Test
    void friendshipMailEscapesUserContentAndLinksToFriends() throws Exception {
        prepareSender();
        new NotificationMailService(enabled, provider)
                .send(MailNotification.friendRequest("friend@example.com", "Ana", "<img src=x>"));
        MimeMessage message = sentMessage();
        String html = findText(message.getContent(), "text/html");
        assertEquals("friend@example.com", message.getAllRecipients()[0].toString());
        assertTrue(html.contains("&lt;img src=x&gt;"));
        assertFalse(html.contains("<img src=x>"));
        assertTrue(html.contains("https://fuelytics.example/friends"));
        assertTrue(findText(message.getContent(), "text/plain").contains("<img src=x> te ha enviado"));
    }

    @Test
    void smtpFailureDoesNotPropagateToApplication() {
        prepareSender();
        doThrow(new MailSendException("SMTP unavailable")).when(sender).send(any(MimeMessage.class));
        assertDoesNotThrow(() -> new NotificationMailService(enabled, provider)
                .send(MailNotification.welcome("new@example.com", "usuario")));
    }

    @Test
    void invalidEnabledConfigurationFailsClearly() {
        assertThrows(IllegalArgumentException.class,
                () -> new NotificationMailProperties(true, "", "Fuelytics", "https://fuelytics.example"));
        assertThrows(IllegalArgumentException.class,
                () -> new NotificationMailProperties(true, "app@example.com", "Fuelytics", "javascript:alert(1)"));
    }

    private void prepareSender() {
        when(provider.getObject()).thenReturn(sender);
        when(sender.createMimeMessage()).thenAnswer(call -> new MimeMessage(Session.getInstance(new Properties())));
    }

    private MimeMessage sentMessage() throws Exception {
        var captor = ArgumentCaptor.forClass(MimeMessage.class);
        verify(sender).send(captor.capture());
        captor.getValue().saveChanges();
        return captor.getValue();
    }

    private String findText(Object content, String type) throws Exception {
        if (content instanceof Multipart multipart) {
            for (int i = 0; i < multipart.getCount(); i++) {
                BodyPart part = multipart.getBodyPart(i);
                if (part.isMimeType(type)) return (String) part.getContent();
                String nested = findText(part.getContent(), type);
                if (!nested.isEmpty()) return nested;
            }
        }
        return "";
    }
}

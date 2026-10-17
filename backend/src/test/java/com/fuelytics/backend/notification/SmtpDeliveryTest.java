package com.fuelytics.backend.notification;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.nio.charset.StandardCharsets;
import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

class SmtpDeliveryTest {
    @Test
    @SuppressWarnings("unchecked")
    void deliversMimeMessageUsingNativeSmtpToLocalTestServer() throws Exception {
        // This fake SMTP server receives only disposable test addresses; no external mail is sent.
        try (var server = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            server.setSoTimeout(5000);
            var received = CompletableFuture.supplyAsync(() -> receiveMessage(server));
            var sender = new JavaMailSenderImpl();
            sender.setHost(server.getInetAddress().getHostAddress());
            sender.setPort(server.getLocalPort());
            sender.getJavaMailProperties().setProperty("mail.smtp.connectiontimeout", "3000");
            sender.getJavaMailProperties().setProperty("mail.smtp.timeout", "3000");
            sender.getJavaMailProperties().setProperty("mail.smtp.writetimeout", "3000");
            ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
            when(provider.getObject()).thenReturn(sender);
            var properties = new NotificationMailProperties(true, "app@example.com", "Fuelytics", "https://app.example");

            new NotificationMailService(properties, provider)
                    .send(MailNotification.friendRequest("friend@example.com", "usuario", "amigo"));

            var message = new MimeMessage(Session.getInstance(new Properties()),
                    new ByteArrayInputStream(received.get(6, TimeUnit.SECONDS).getBytes(StandardCharsets.UTF_8)));
            assertEquals("friend@example.com", message.getAllRecipients()[0].toString());
            assertEquals("Tienes una nueva solicitud de amistad en Fuelytics", message.getSubject());
            assertTrue(message.isMimeType("multipart/*"));
        }
    }

    private String receiveMessage(ServerSocket server) {
        try (var socket = server.accept();
                var input = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                var output = new PrintWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8), true)) {
            socket.setSoTimeout(5000);
            reply(output, "220 localhost test SMTP");
            StringBuilder message = new StringBuilder();
            boolean data = false;
            String line;
            while ((line = input.readLine()) != null) {
                if (data) {
                    if (line.equals(".")) {
                        data = false;
                        reply(output, "250 Message accepted");
                    } else {
                        message.append(line.startsWith("..") ? line.substring(1) : line).append("\r\n");
                    }
                } else if (line.startsWith("EHLO") || line.startsWith("HELO")) {
                    reply(output, "250 localhost");
                } else if (line.startsWith("MAIL FROM:") || line.startsWith("RCPT TO:")) {
                    reply(output, "250 OK");
                } else if (line.equals("DATA")) {
                    data = true;
                    reply(output, "354 End with dot");
                } else if (line.equals("QUIT")) {
                    reply(output, "221 Bye");
                    return message.toString();
                } else {
                    reply(output, "500 Unsupported test command");
                }
            }
            throw new IllegalStateException("SMTP test connection closed before QUIT");
        } catch (Exception exception) {
            throw new IllegalStateException("Local SMTP test failed", exception);
        }
    }

    private void reply(PrintWriter output, String line) {
        output.print(line + "\r\n");
        output.flush();
    }
}

package com.fuelytics.backend.notification;

import java.nio.charset.StandardCharsets;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class NotificationMailService {
    private static final Logger log = LoggerFactory.getLogger(NotificationMailService.class);
    private final NotificationMailProperties properties;
    private final ObjectProvider<JavaMailSender> senderProvider;

    public NotificationMailService(NotificationMailProperties properties, ObjectProvider<JavaMailSender> senderProvider) {
        this.properties = properties;
        this.senderProvider = senderProvider;
    }

    public void send(MailNotification notification) {
        if (!properties.enabled()) return;
        try {
            JavaMailSender sender = senderProvider.getObject();
            var message = sender.createMimeMessage();
            var helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setValidateAddresses(true);
            helper.setFrom(properties.from(), properties.fromName());
            helper.setTo(notification.recipient());
            boolean welcome = notification.type() == MailNotification.Type.WELCOME;
            String subject = welcome ? "Te damos la bienvenida a Fuelytics" : "Tienes una nueva solicitud de amistad en Fuelytics";
            String description = welcome
                    ? "Tu cuenta ya está lista. Añade tu primer vehículo y empieza a controlar tus repostajes, gastos y consumo."
                    : notification.requesterUsername() + " te ha enviado una solicitud de amistad. Puedes aceptarla o rechazarla desde la sección Amigos.";
            String action = welcome ? "Ir a mi garaje" : "Ver solicitudes de amistad";
            String url = properties.frontendUrl().replaceAll("/+$", "") + (welcome ? "/dashboard" : "/friends");
            String greeting = "Hola, " + notification.username() + ":";
            String footer = "Este es un aviso automático de Fuelytics. No incluye contraseñas ni datos de acceso.";
            String plain = greeting + "\n\n" + description + "\n\n" + action + ": " + url + "\n\n" + footer;
            String html = """
                    <!doctype html><html lang="es"><body style="margin:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
                    <div style="max-width:560px;margin:32px auto;padding:32px;background:#ffffff;border-radius:20px">
                    <p style="color:#0f766e;font-weight:bold">FUELYTICS</p>
                    <h1 style="font-size:24px">%s</h1><p>%s</p><p style="line-height:1.7">%s</p>
                    <p style="margin:28px 0"><a href="%s" style="display:inline-block;padding:14px 20px;border-radius:12px;background:#0f766e;color:white;text-decoration:none">%s</a></p>
                    <p style="font-size:12px;color:#64748b;line-height:1.6">%s</p></div></body></html>
                    """.formatted(escape(subject), escape(greeting), escape(description), escape(url), escape(action), escape(footer));
            helper.setSubject(subject);
            helper.setText(plain, html);
            sender.send(message);
            log.info("Correo {} enviado al servidor SMTP", notification.type());
        } catch (Exception exception) {
            // Do not log SMTP responses, credentials, recipient addresses or message contents.
            log.warn("No se pudo enviar el correo {} por SMTP ({})", notification.type(), exception.getClass().getSimpleName());
        }
    }

    private String escape(String value) {
        return HtmlUtils.htmlEscape(value, StandardCharsets.UTF_8.name());
    }
}

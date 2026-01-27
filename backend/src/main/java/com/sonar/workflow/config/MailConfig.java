package com.sonar.workflow.config;

import com.sonar.workflow.service.SettingService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessagePreparator;

import java.io.InputStream;
import java.util.Properties;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class MailConfig {

    private final SettingService settingService;

    @Bean
    @Primary
    public JavaMailSender javaMailSender() {
        return new DynamicMailSender(settingService);
    }

    /**
     * Custom JavaMailSender that creates a fresh, properly configured
     * JavaMailSenderImpl for each email operation using database settings.
     */
    @Slf4j
    public static class DynamicMailSender implements JavaMailSender {

        private final SettingService settingService;

        public DynamicMailSender(SettingService settingService) {
            this.settingService = settingService;
        }

        /**
         * Create a fresh JavaMailSenderImpl with current settings
         */
        private JavaMailSenderImpl createConfiguredSender() {
            JavaMailSenderImpl sender = new JavaMailSenderImpl();

            String host = settingService.getValue("mail.host", "smtp.gmail.com");
            int port = settingService.getIntValue("mail.port", 587);
            String username = settingService.getValue("mail.username", "");
            String password = settingService.getValue("mail.password", "");
            String protocol = settingService.getValue("mail.protocol", "smtp");

            log.debug("Configuring mail sender - Host: {}, Port: {}, Username: {}", host, port, username);

            sender.setHost(host);
            sender.setPort(port);
            sender.setUsername(username);
            sender.setPassword(password);
            sender.setProtocol(protocol);

            Properties props = sender.getJavaMailProperties();
            props.put("mail.smtp.auth", settingService.getValue("mail.smtp.auth", "true"));
            props.put("mail.smtp.starttls.enable", settingService.getValue("mail.smtp.starttls.enable", "true"));
            props.put("mail.smtp.starttls.required", settingService.getValue("mail.smtp.starttls.enable", "true"));
            props.put("mail.smtp.ssl.enable", settingService.getValue("mail.smtp.ssl.enable", "false"));

            String sslTrust = settingService.getValue("mail.smtp.ssl.trust", "");
            if (sslTrust != null && !sslTrust.isEmpty()) {
                props.put("mail.smtp.ssl.trust", sslTrust);
            }

            props.put("mail.smtp.connectiontimeout", settingService.getValue("mail.smtp.connectiontimeout", "5000"));
            props.put("mail.smtp.timeout", settingService.getValue("mail.smtp.timeout", "5000"));
            props.put("mail.smtp.writetimeout", settingService.getValue("mail.smtp.writetimeout", "5000"));
            props.put("mail.debug", settingService.getValue("mail.debug", "false"));

            return sender;
        }

        @Override
        public MimeMessage createMimeMessage() {
            return createConfiguredSender().createMimeMessage();
        }

        @Override
        public MimeMessage createMimeMessage(InputStream contentStream) throws MailException {
            return createConfiguredSender().createMimeMessage(contentStream);
        }

        @Override
        public void send(MimeMessage mimeMessage) throws MailException {
            createConfiguredSender().send(mimeMessage);
        }

        @Override
        public void send(MimeMessage... mimeMessages) throws MailException {
            createConfiguredSender().send(mimeMessages);
        }

        @Override
        public void send(MimeMessagePreparator mimeMessagePreparator) throws MailException {
            createConfiguredSender().send(mimeMessagePreparator);
        }

        @Override
        public void send(MimeMessagePreparator... mimeMessagePreparators) throws MailException {
            createConfiguredSender().send(mimeMessagePreparators);
        }

        @Override
        public void send(SimpleMailMessage simpleMessage) throws MailException {
            createConfiguredSender().send(simpleMessage);
        }

        @Override
        public void send(SimpleMailMessage... simpleMessages) throws MailException {
            createConfiguredSender().send(simpleMessages);
        }
    }
}

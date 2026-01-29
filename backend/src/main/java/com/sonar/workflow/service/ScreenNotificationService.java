package com.sonar.workflow.service;

import com.sonar.workflow.entity.ScreenNotifier;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.repository.ScreenNotifierRepository;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ScreenNotificationService {

    private final ScreenNotifierRepository screenNotifierRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Async
    @Transactional(readOnly = true)
    public void sendScreenNotifications(UUID screenId, String workflowName, String screenTitle,
                                         String filledByName, List<Map<String, String>> fieldValues) {
        try {
            List<ScreenNotifier> notifiers = screenNotifierRepository.findByScreenId(screenId);
            if (notifiers.isEmpty()) {
                return;
            }

            // Resolve all recipient emails, deduplicating
            Set<String> recipientEmails = new LinkedHashSet<>();

            for (ScreenNotifier notifier : notifiers) {
                switch (notifier.getNotifierType()) {
                    case EMAIL:
                        if (notifier.getEmail() != null && !notifier.getEmail().isBlank()) {
                            recipientEmails.add(notifier.getEmail().trim().toLowerCase());
                        }
                        break;
                    case USER:
                        if (notifier.getUser() != null) {
                            String userEmail = notifier.getUser().getEmail();
                            if (userEmail != null && !userEmail.isBlank()) {
                                recipientEmails.add(userEmail.trim().toLowerCase());
                            }
                        }
                        break;
                    case ROLE:
                        if (notifier.getRole() != null) {
                            // Find all active users with this role
                            List<User> activeUsers = userRepository.findAllActiveUsers();
                            for (User user : activeUsers) {
                                if (user.getRoles().stream()
                                        .anyMatch(r -> r.getId().equals(notifier.getRole().getId()))) {
                                    if (user.getEmail() != null && !user.getEmail().isBlank()) {
                                        recipientEmails.add(user.getEmail().trim().toLowerCase());
                                    }
                                }
                            }
                        }
                        break;
                }
            }

            // Send notification to each unique recipient
            for (String email : recipientEmails) {
                try {
                    emailService.sendScreenNotificationEmail(email, workflowName, screenTitle, filledByName, fieldValues);
                } catch (Exception e) {
                    log.error("Failed to send screen notification email to {}", email, e);
                }
            }

            log.info("Screen notification emails sent to {} recipients for screen '{}'", recipientEmails.size(), screenTitle);
        } catch (Exception e) {
            log.error("Failed to process screen notifications for screenId={}", screenId, e);
        }
    }
}

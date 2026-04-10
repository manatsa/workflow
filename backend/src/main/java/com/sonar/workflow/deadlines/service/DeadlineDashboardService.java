package com.sonar.workflow.deadlines.service;

import com.sonar.workflow.deadlines.dto.DeadlineDashboardDTO;
import com.sonar.workflow.deadlines.dto.DeadlineInstanceDTO;
import com.sonar.workflow.deadlines.entity.DeadlineInstance;
import com.sonar.workflow.deadlines.entity.DeadlineItem;
import com.sonar.workflow.deadlines.repository.DeadlineInstanceRepository;
import com.sonar.workflow.deadlines.repository.DeadlineItemRepository;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DeadlineDashboardService {

    private final DeadlineItemRepository itemRepository;
    private final DeadlineInstanceRepository instanceRepository;
    private final DeadlineItemService itemService;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public DeadlineDashboardDTO getDashboard() {
        LocalDate today = LocalDate.now();
        LocalDate monthStart = today.withDayOfMonth(1);

        long totalActive = itemRepository.countByStatus(DeadlineItem.DeadlineItemStatus.ACTIVE);
        long upcomingCount = instanceRepository.countByStatus(DeadlineInstance.InstanceStatus.UPCOMING);
        long dueSoonCount = instanceRepository.countByStatus(DeadlineInstance.InstanceStatus.DUE_SOON);
        long overdueCount = instanceRepository.countByStatus(DeadlineInstance.InstanceStatus.OVERDUE);
        long completedThisMonth = instanceRepository.countCompletedSince(monthStart.atStartOfDay());

        List<DeadlineInstanceDTO> upcoming = instanceRepository
                .findUpcomingWithItem(today, today.plusDays(30)).stream()
                .limit(10)
                .map(itemService::toInstanceDTO)
                .collect(Collectors.toList());

        List<DeadlineInstanceDTO> overdue = instanceRepository
                .findOverdueWithItem().stream()
                .map(itemService::toInstanceDTO)
                .collect(Collectors.toList());

        List<DeadlineInstanceDTO> recentlyCompleted = instanceRepository
                .findByStatusIn(List.of(DeadlineInstance.InstanceStatus.COMPLETED)).stream()
                .filter(i -> i.getCompletedAt() != null && i.getCompletedAt().isAfter(monthStart.atStartOfDay()))
                .limit(5)
                .map(itemService::toInstanceDTO)
                .collect(Collectors.toList());

        // User-specific badge counts
        long myOverdueCount = 0;
        long myDueSoonCount = 0;
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(username).orElse(null);
            if (currentUser != null) {
                myOverdueCount = instanceRepository.countOverdueForUser(currentUser.getId());
                // Due soon = within 30 days reminder window
                LocalDate reminderDate = today.plusDays(30);
                myDueSoonCount = instanceRepository.countDueSoonForUser(currentUser.getId(), reminderDate);
            }
        } catch (Exception e) {
            log.debug("Could not load user-specific deadline counts: {}", e.getMessage());
        }

        return DeadlineDashboardDTO.builder()
                .totalActive(totalActive)
                .upcomingCount(upcomingCount)
                .dueSoonCount(dueSoonCount)
                .overdueCount(overdueCount)
                .completedThisMonth(completedThisMonth)
                .upcomingDeadlines(upcoming)
                .overdueDeadlines(overdue)
                .recentlyCompleted(recentlyCompleted)
                .myOverdueCount(myOverdueCount)
                .myDueSoonCount(myDueSoonCount)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getBadgeCounts() {
        long myOverdueCount = 0;
        long myDueSoonCount = 0;
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User currentUser = userRepository.findByUsername(username).orElse(null);
            if (currentUser != null) {
                myOverdueCount = instanceRepository.countOverdueForUser(currentUser.getId());
                LocalDate reminderDate = LocalDate.now().plusDays(30);
                myDueSoonCount = instanceRepository.countDueSoonForUser(currentUser.getId(), reminderDate);
            }
        } catch (Exception e) {
            log.debug("Could not load user-specific deadline counts: {}", e.getMessage());
        }
        return Map.of("overdue", myOverdueCount, "dueSoon", myDueSoonCount);
    }
}

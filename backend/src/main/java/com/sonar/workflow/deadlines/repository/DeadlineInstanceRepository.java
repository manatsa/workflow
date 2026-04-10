package com.sonar.workflow.deadlines.repository;

import com.sonar.workflow.deadlines.entity.DeadlineInstance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeadlineInstanceRepository extends JpaRepository<DeadlineInstance, UUID> {

    List<DeadlineInstance> findByDeadlineItemIdOrderByDueDateAsc(UUID deadlineItemId);

    List<DeadlineInstance> findByStatusIn(List<DeadlineInstance.InstanceStatus> statuses);

    @Query("SELECT i FROM DeadlineInstance i WHERE i.status IN :statuses AND i.dueDate BETWEEN :from AND :to ORDER BY i.dueDate ASC")
    List<DeadlineInstance> findByStatusInAndDueDateBetween(
            @Param("statuses") List<DeadlineInstance.InstanceStatus> statuses,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to);

    @Query("SELECT i FROM DeadlineInstance i WHERE i.status = :status AND i.dueDate < :date ORDER BY i.dueDate ASC")
    List<DeadlineInstance> findByStatusAndDueDateBefore(
            @Param("status") DeadlineInstance.InstanceStatus status,
            @Param("date") LocalDate date);

    @Query("SELECT i FROM DeadlineInstance i JOIN FETCH i.deadlineItem WHERE i.dueDate BETWEEN :from AND :to AND i.deadlineItem.isActive = true ORDER BY i.dueDate ASC")
    List<DeadlineInstance> findUpcomingWithItem(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("SELECT i FROM DeadlineInstance i JOIN FETCH i.deadlineItem WHERE i.status = 'OVERDUE' AND i.deadlineItem.isActive = true ORDER BY i.dueDate ASC")
    List<DeadlineInstance> findOverdueWithItem();

    long countByStatus(DeadlineInstance.InstanceStatus status);

    @Query("SELECT COUNT(i) FROM DeadlineInstance i WHERE i.status = 'COMPLETED' AND i.completedAt >= :since")
    long countCompletedSince(@Param("since") java.time.LocalDateTime since);

    Optional<DeadlineInstance> findByDeadlineItemIdAndDueDate(UUID deadlineItemId, LocalDate dueDate);

    @Query("SELECT i FROM DeadlineInstance i WHERE i.deadlineItem.id = :itemId AND i.status NOT IN ('COMPLETED', 'SKIPPED') ORDER BY i.dueDate ASC")
    List<DeadlineInstance> findActiveByDeadlineItemId(@Param("itemId") UUID itemId);

    @Query("SELECT COUNT(i) FROM DeadlineInstance i WHERE i.status = 'OVERDUE' " +
           "AND i.deadlineItem.isActive = true " +
           "AND (i.deadlineItem.owner.id = :userId " +
           "OR i.deadlineItem.id IN (SELECT r.deadlineItem.id FROM DeadlineRecipient r WHERE r.user.id = :userId AND r.notifyOnOverdue = true))")
    long countOverdueForUser(@Param("userId") UUID userId);

    @Query("SELECT COUNT(i) FROM DeadlineInstance i WHERE i.status IN ('UPCOMING', 'DUE_SOON') " +
           "AND i.deadlineItem.isActive = true " +
           "AND i.dueDate <= :reminderDate " +
           "AND (i.deadlineItem.owner.id = :userId " +
           "OR i.deadlineItem.id IN (SELECT r.deadlineItem.id FROM DeadlineRecipient r WHERE r.user.id = :userId AND r.notifyOnReminder = true))")
    long countDueSoonForUser(@Param("userId") UUID userId, @Param("reminderDate") LocalDate reminderDate);
}

package com.sonar.workflow.deadlines.repository;

import com.sonar.workflow.deadlines.entity.DeadlineAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeadlineActionRepository extends JpaRepository<DeadlineAction, UUID> {

    List<DeadlineAction> findByDeadlineItemIdOrderByDisplayOrderAsc(UUID deadlineItemId);

    List<DeadlineAction> findByDeadlineItemId(UUID deadlineItemId);
}

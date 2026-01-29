package com.sonar.workflow.repository;

import com.sonar.workflow.entity.ScreenNotifier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ScreenNotifierRepository extends JpaRepository<ScreenNotifier, UUID> {

    List<ScreenNotifier> findByScreenId(UUID screenId);
}

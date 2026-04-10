package com.sonar.workflow.deadlines.repository;

import com.sonar.workflow.deadlines.entity.DeadlineItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeadlineItemRepository extends JpaRepository<DeadlineItem, UUID> {

    List<DeadlineItem> findByIsActiveTrueOrderByCreatedAtDesc();

    Optional<DeadlineItem> findByCode(String code);

    boolean existsByCode(String code);

    List<DeadlineItem> findByCategoryId(UUID categoryId);

    List<DeadlineItem> findByStatus(DeadlineItem.DeadlineItemStatus status);

    List<DeadlineItem> findByStatusAndIsActiveTrue(DeadlineItem.DeadlineItemStatus status);

    @Query("SELECT d FROM DeadlineItem d LEFT JOIN d.category c WHERE d.isActive = true AND " +
           "(LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.code) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<DeadlineItem> searchDeadlines(@Param("search") String search, Pageable pageable);

    long countByStatus(DeadlineItem.DeadlineItemStatus status);

    long countByCodeStartingWith(String codePrefix);
}

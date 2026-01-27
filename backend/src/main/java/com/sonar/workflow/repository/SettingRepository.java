package com.sonar.workflow.repository;

import com.sonar.workflow.entity.Setting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SettingRepository extends JpaRepository<Setting, UUID> {

    Optional<Setting> findByKey(String key);

    boolean existsByKey(String key);

    List<Setting> findByCategory(String category);

    List<Setting> findByTab(String tab);

    @Query("SELECT DISTINCT s.tab FROM Setting s WHERE s.tab IS NOT NULL ORDER BY s.tab")
    List<String> findAllTabs();

    @Query("SELECT DISTINCT s.category FROM Setting s WHERE s.category IS NOT NULL ORDER BY s.category")
    List<String> findAllCategories();

    @Query("SELECT s FROM Setting s WHERE s.tab = :tab ORDER BY s.displayOrder, s.key")
    List<Setting> findByTabOrdered(@Param("tab") String tab);

    List<Setting> findByIsSystemFalse();
}

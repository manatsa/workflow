package com.sonar.workflow.leave.repository;

import com.sonar.workflow.leave.entity.PublicHoliday;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface PublicHolidayRepository extends JpaRepository<PublicHoliday, UUID> {

    List<PublicHoliday> findByYear(int year);

    List<PublicHoliday> findByYearAndIsActiveTrue(int year);

    List<PublicHoliday> findByDateBetween(LocalDate start, LocalDate end);

    boolean existsByDateAndName(LocalDate date, String name);

    List<PublicHoliday> findByIsActiveTrueOrderByDateAsc();
}

package com.sonar.workflow.leave.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.PublicHolidayDTO;
import com.sonar.workflow.leave.entity.PublicHoliday;
import com.sonar.workflow.leave.repository.PublicHolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublicHolidayService {

    private final PublicHolidayRepository publicHolidayRepository;

    @Transactional(readOnly = true)
    public List<PublicHolidayDTO> getAll() {
        return publicHolidayRepository.findByIsActiveTrueOrderByDateAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PublicHolidayDTO> getByYear(int year) {
        return publicHolidayRepository.findByYearAndIsActiveTrue(year).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PublicHolidayDTO getById(UUID id) {
        return toDTO(publicHolidayRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Public holiday not found")));
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getHolidayDatesBetween(LocalDate start, LocalDate end) {
        return publicHolidayRepository.findByDateBetween(start, end).stream()
                .filter(h -> Boolean.TRUE.equals(h.getIsActive()))
                .map(PublicHoliday::getDate)
                .collect(Collectors.toList());
    }

    @Transactional
    public PublicHolidayDTO create(PublicHolidayDTO dto) {
        PublicHoliday entity = new PublicHoliday();
        mapDtoToEntity(dto, entity);
        entity = publicHolidayRepository.save(entity);
        log.info("Created public holiday: {} on {}", entity.getName(), entity.getDate());
        return toDTO(entity);
    }

    @Transactional
    public PublicHolidayDTO update(UUID id, PublicHolidayDTO dto) {
        PublicHoliday entity = publicHolidayRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Public holiday not found"));
        mapDtoToEntity(dto, entity);
        entity = publicHolidayRepository.save(entity);
        log.info("Updated public holiday: {}", entity.getName());
        return toDTO(entity);
    }

    @Transactional
    public void delete(UUID id) {
        PublicHoliday entity = publicHolidayRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Public holiday not found"));
        entity.setIsActive(false);
        publicHolidayRepository.save(entity);
        log.info("Soft-deleted public holiday: {}", entity.getName());
    }

    @Transactional
    public List<PublicHolidayDTO> bulkImport(List<PublicHolidayDTO> holidays) {
        return holidays.stream().map(dto -> {
            PublicHoliday entity = new PublicHoliday();
            mapDtoToEntity(dto, entity);
            return toDTO(publicHolidayRepository.save(entity));
        }).collect(Collectors.toList());
    }

    private void mapDtoToEntity(PublicHolidayDTO dto, PublicHoliday entity) {
        entity.setName(dto.getName());
        LocalDate date = LocalDate.parse(dto.getDate());
        entity.setDate(date);
        entity.setYear(dto.getYear() != null ? dto.getYear() : date.getYear());
        entity.setCountry(dto.getCountry());
        entity.setRegion(dto.getRegion());
        entity.setIsRecurring(dto.getIsRecurring() != null ? dto.getIsRecurring() : false);
        entity.setDescription(dto.getDescription());
        if (dto.getIsActive() != null) {
            entity.setIsActive(dto.getIsActive());
        }
    }

    public PublicHolidayDTO toDTO(PublicHoliday entity) {
        return PublicHolidayDTO.builder()
                .id(entity.getId())
                .name(entity.getName())
                .date(entity.getDate() != null ? entity.getDate().toString() : null)
                .year(entity.getYear())
                .country(entity.getCountry())
                .region(entity.getRegion())
                .isRecurring(entity.getIsRecurring())
                .description(entity.getDescription())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .build();
    }
}

package com.sonar.workflow.leave.service;

import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeavePolicyDTO;
import com.sonar.workflow.leave.entity.LeavePolicy;
import com.sonar.workflow.leave.entity.LeaveType;
import com.sonar.workflow.leave.repository.LeavePolicyRepository;
import com.sonar.workflow.leave.repository.LeaveTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LeavePolicyService {

    private final LeavePolicyRepository leavePolicyRepository;
    private final LeaveTypeRepository leaveTypeRepository;

    @Transactional(readOnly = true)
    public List<LeavePolicyDTO> getAll() {
        return leavePolicyRepository.findByIsActiveTrueOrderByLeaveType_NameAsc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LeavePolicyDTO getById(UUID id) {
        return toDTO(leavePolicyRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave policy not found")));
    }

    @Transactional(readOnly = true)
    public List<LeavePolicyDTO> getByLeaveType(UUID leaveTypeId) {
        return leavePolicyRepository.findByLeaveTypeId(leaveTypeId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public LeavePolicyDTO create(LeavePolicyDTO dto) {
        LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
                .orElseThrow(() -> new BusinessException("Leave type not found"));

        LeavePolicy entity = new LeavePolicy();
        mapDtoToEntity(dto, entity);
        entity.setLeaveType(leaveType);

        // If this is default, unset other defaults for this leave type
        if (Boolean.TRUE.equals(dto.getIsDefault())) {
            leavePolicyRepository.findByLeaveTypeIdAndIsDefaultTrue(dto.getLeaveTypeId())
                    .ifPresent(existing -> {
                        existing.setIsDefault(false);
                        leavePolicyRepository.save(existing);
                    });
        }

        entity = leavePolicyRepository.save(entity);
        log.info("Created leave policy: {} for type: {}", entity.getName(), leaveType.getCode());
        return toDTO(entity);
    }

    @Transactional
    public LeavePolicyDTO update(UUID id, LeavePolicyDTO dto) {
        LeavePolicy entity = leavePolicyRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave policy not found"));

        if (dto.getLeaveTypeId() != null && !dto.getLeaveTypeId().equals(entity.getLeaveType().getId())) {
            LeaveType leaveType = leaveTypeRepository.findById(dto.getLeaveTypeId())
                    .orElseThrow(() -> new BusinessException("Leave type not found"));
            entity.setLeaveType(leaveType);
        }

        // If setting as default, unset other defaults
        if (Boolean.TRUE.equals(dto.getIsDefault()) && !Boolean.TRUE.equals(entity.getIsDefault())) {
            leavePolicyRepository.findByLeaveTypeIdAndIsDefaultTrue(entity.getLeaveType().getId())
                    .ifPresent(existing -> {
                        if (!existing.getId().equals(id)) {
                            existing.setIsDefault(false);
                            leavePolicyRepository.save(existing);
                        }
                    });
        }

        mapDtoToEntity(dto, entity);
        entity = leavePolicyRepository.save(entity);
        log.info("Updated leave policy: {}", entity.getName());
        return toDTO(entity);
    }

    @Transactional
    public void delete(UUID id) {
        LeavePolicy entity = leavePolicyRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Leave policy not found"));
        entity.setIsActive(false);
        leavePolicyRepository.save(entity);
        log.info("Soft-deleted leave policy: {}", entity.getName());
    }

    private void mapDtoToEntity(LeavePolicyDTO dto, LeavePolicy entity) {
        entity.setName(dto.getName());
        entity.setDaysAllowed(dto.getDaysAllowed());
        entity.setMaxCarryOverDays(dto.getMaxCarryOverDays() != null ? dto.getMaxCarryOverDays() : 0);
        entity.setCarryOverExpiryMonths(dto.getCarryOverExpiryMonths() != null ? dto.getCarryOverExpiryMonths() : 3);
        entity.setAccrualMethod(dto.getAccrualMethod() != null ?
                LeavePolicy.AccrualMethod.valueOf(dto.getAccrualMethod()) : LeavePolicy.AccrualMethod.ANNUAL_UPFRONT);
        entity.setProRataForNewJoiners(dto.getProRataForNewJoiners() != null ? dto.getProRataForNewJoiners() : true);
        entity.setProbationMonths(dto.getProbationMonths() != null ? dto.getProbationMonths() : 0);
        entity.setProbationDaysAllowed(dto.getProbationDaysAllowed());
        entity.setAllowNegativeBalance(dto.getAllowNegativeBalance() != null ? dto.getAllowNegativeBalance() : false);
        entity.setMaxNegativeDays(dto.getMaxNegativeDays() != null ? dto.getMaxNegativeDays() : 0);
        entity.setAllowHalfDay(dto.getAllowHalfDay() != null ? dto.getAllowHalfDay() : true);
        entity.setEncashmentAllowed(dto.getEncashmentAllowed() != null ? dto.getEncashmentAllowed() : false);
        entity.setMaxEncashmentDays(dto.getMaxEncashmentDays());
        entity.setMinServiceMonthsForEncashment(dto.getMinServiceMonthsForEncashment());
        entity.setMinDaysBeforeRequest(dto.getMinDaysBeforeRequest() != null ? dto.getMinDaysBeforeRequest() : 1);
        entity.setIsDefault(dto.getIsDefault() != null ? dto.getIsDefault() : false);
    }

    public LeavePolicyDTO toDTO(LeavePolicy entity) {
        return LeavePolicyDTO.builder()
                .id(entity.getId())
                .leaveTypeId(entity.getLeaveType().getId())
                .leaveTypeName(entity.getLeaveType().getName())
                .leaveTypeCode(entity.getLeaveType().getCode())
                .name(entity.getName())
                .daysAllowed(entity.getDaysAllowed())
                .maxCarryOverDays(entity.getMaxCarryOverDays())
                .carryOverExpiryMonths(entity.getCarryOverExpiryMonths())
                .accrualMethod(entity.getAccrualMethod() != null ? entity.getAccrualMethod().name() : null)
                .proRataForNewJoiners(entity.getProRataForNewJoiners())
                .probationMonths(entity.getProbationMonths())
                .probationDaysAllowed(entity.getProbationDaysAllowed())
                .allowNegativeBalance(entity.getAllowNegativeBalance())
                .maxNegativeDays(entity.getMaxNegativeDays())
                .allowHalfDay(entity.getAllowHalfDay())
                .encashmentAllowed(entity.getEncashmentAllowed())
                .maxEncashmentDays(entity.getMaxEncashmentDays())
                .minServiceMonthsForEncashment(entity.getMinServiceMonthsForEncashment())
                .minDaysBeforeRequest(entity.getMinDaysBeforeRequest())
                .isDefault(entity.getIsDefault())
                .isActive(entity.getIsActive())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().toString() : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().toString() : null)
                .build();
    }
}

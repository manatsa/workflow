package com.sonar.workflow.leave.service;

import com.sonar.workflow.entity.Department;
import com.sonar.workflow.entity.User;
import com.sonar.workflow.exception.BusinessException;
import com.sonar.workflow.leave.dto.LeaveApproverDTO;
import com.sonar.workflow.leave.entity.LeaveApprover;
import com.sonar.workflow.leave.repository.LeaveApproverRepository;
import com.sonar.workflow.repository.DepartmentRepository;
import com.sonar.workflow.repository.UserRepository;
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
public class LeaveApproverService {

    private final LeaveApproverRepository leaveApproverRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<LeaveApproverDTO> getByDepartment(UUID departmentId) {
        return leaveApproverRepository.findByDepartmentIdOrderByLevelAscDisplayOrderAsc(departmentId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public LeaveApproverDTO create(LeaveApproverDTO dto) {
        Department department = departmentRepository.findById(dto.getDepartmentId())
                .orElseThrow(() -> new BusinessException("Department not found"));
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new BusinessException("User not found"));

        if (leaveApproverRepository.findByDepartmentIdAndUserId(department.getId(), user.getId()).isPresent()) {
            throw new BusinessException("This user is already an approver for this department");
        }

        LeaveApprover approver = LeaveApprover.builder()
                .department(department)
                .user(user)
                .level(dto.getLevel() != null ? dto.getLevel() : 1)
                .approverName(user.getFullName())
                .approverEmail(user.getEmail())
                .canEscalate(dto.getCanEscalate() != null ? dto.getCanEscalate() : true)
                .escalationTimeoutHours(dto.getEscalationTimeoutHours())
                .notifyOnPending(dto.getNotifyOnPending() != null ? dto.getNotifyOnPending() : true)
                .notifyOnApproval(dto.getNotifyOnApproval() != null ? dto.getNotifyOnApproval() : true)
                .notifyOnRejection(dto.getNotifyOnRejection() != null ? dto.getNotifyOnRejection() : true)
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .build();

        return toDTO(leaveApproverRepository.save(approver));
    }

    @Transactional
    public LeaveApproverDTO update(UUID id, LeaveApproverDTO dto) {
        LeaveApprover approver = leaveApproverRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Approver not found"));

        if (dto.getLevel() != null) approver.setLevel(dto.getLevel());
        if (dto.getCanEscalate() != null) approver.setCanEscalate(dto.getCanEscalate());
        approver.setEscalationTimeoutHours(dto.getEscalationTimeoutHours());
        if (dto.getNotifyOnPending() != null) approver.setNotifyOnPending(dto.getNotifyOnPending());
        if (dto.getNotifyOnApproval() != null) approver.setNotifyOnApproval(dto.getNotifyOnApproval());
        if (dto.getNotifyOnRejection() != null) approver.setNotifyOnRejection(dto.getNotifyOnRejection());
        if (dto.getDisplayOrder() != null) approver.setDisplayOrder(dto.getDisplayOrder());

        return toDTO(leaveApproverRepository.save(approver));
    }

    @Transactional
    public void delete(UUID id) {
        leaveApproverRepository.deleteById(id);
    }

    @Transactional
    public List<LeaveApproverDTO> replaceChain(UUID departmentId, List<LeaveApproverDTO> approvers) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new BusinessException("Department not found"));

        leaveApproverRepository.deleteByDepartmentId(departmentId);
        leaveApproverRepository.flush();

        return approvers.stream().map(dto -> {
            User user = userRepository.findById(dto.getUserId())
                    .orElseThrow(() -> new BusinessException("User not found: " + dto.getUserId()));

            LeaveApprover approver = LeaveApprover.builder()
                    .department(department)
                    .user(user)
                    .level(dto.getLevel() != null ? dto.getLevel() : 1)
                    .approverName(user.getFullName())
                    .approverEmail(user.getEmail())
                    .canEscalate(dto.getCanEscalate() != null ? dto.getCanEscalate() : true)
                    .escalationTimeoutHours(dto.getEscalationTimeoutHours())
                    .notifyOnPending(dto.getNotifyOnPending() != null ? dto.getNotifyOnPending() : true)
                    .notifyOnApproval(dto.getNotifyOnApproval() != null ? dto.getNotifyOnApproval() : true)
                    .notifyOnRejection(dto.getNotifyOnRejection() != null ? dto.getNotifyOnRejection() : true)
                    .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                    .build();

            return toDTO(leaveApproverRepository.save(approver));
        }).collect(Collectors.toList());
    }

    private LeaveApproverDTO toDTO(LeaveApprover entity) {
        return LeaveApproverDTO.builder()
                .id(entity.getId())
                .departmentId(entity.getDepartment().getId())
                .departmentName(entity.getDepartment().getName())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getFullName())
                .userEmail(entity.getUser().getEmail())
                .level(entity.getLevel())
                .approverName(entity.getApproverName())
                .approverEmail(entity.getApproverEmail())
                .canEscalate(entity.getCanEscalate())
                .escalationTimeoutHours(entity.getEscalationTimeoutHours())
                .notifyOnPending(entity.getNotifyOnPending())
                .notifyOnApproval(entity.getNotifyOnApproval())
                .notifyOnRejection(entity.getNotifyOnRejection())
                .displayOrder(entity.getDisplayOrder())
                .isActive(entity.getIsActive())
                .build();
    }
}

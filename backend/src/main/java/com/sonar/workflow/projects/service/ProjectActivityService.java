package com.sonar.workflow.projects.service;

import com.sonar.workflow.entity.User;
import com.sonar.workflow.projects.dto.ProjectActivityDTO;
import com.sonar.workflow.projects.entity.Project;
import com.sonar.workflow.projects.entity.ProjectActivity;
import com.sonar.workflow.projects.repository.ProjectActivityRepository;
import com.sonar.workflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectActivityService {

    private final ProjectActivityRepository activityRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordActivity(Project project, String type, String description, String entityType, UUID entityId) {
        User user = getCurrentUser();

        ProjectActivity activity = ProjectActivity.builder()
                .project(project)
                .user(user)
                .type(type)
                .description(description)
                .entityType(entityType)
                .entityId(entityId)
                .build();

        activityRepository.save(activity);
        log.debug("Activity recorded: {} - {} on project {}", type, description, project.getCode());
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> getProjectActivities(UUID projectId) {
        return activityRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProjectActivityDTO> getRecentActivities(int limit) {
        return activityRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit)).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }

    private ProjectActivityDTO toDTO(ProjectActivity a) {
        return ProjectActivityDTO.builder()
                .id(a.getId())
                .projectId(a.getProject().getId())
                .userId(a.getUser() != null ? a.getUser().getId() : null)
                .type(a.getType())
                .description(a.getDescription())
                .entityType(a.getEntityType())
                .entityId(a.getEntityId())
                .userName(a.getUser() != null ? a.getUser().getFirstName() + " " + a.getUser().getLastName() : "System")
                .timestamp(a.getCreatedAt())
                .build();
    }
}

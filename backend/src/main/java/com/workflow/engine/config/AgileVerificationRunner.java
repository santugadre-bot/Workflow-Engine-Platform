package com.workflow.engine.config;

import com.workflow.engine.agile.entity.Board;
import com.workflow.engine.agile.entity.BoardType;
import com.workflow.engine.agile.entity.Sprint;
import com.workflow.engine.agile.entity.SprintStatus;
import com.workflow.engine.agile.service.BoardService;
import com.workflow.engine.agile.service.SprintService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.ProjectRole;
import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.rbac.repository.ProjectMemberRepository;
import com.workflow.engine.rbac.entity.ProjectMember;
import com.workflow.engine.task.dto.CreateTaskRequest;
import com.workflow.engine.task.dto.TaskResponse;
import com.workflow.engine.task.entity.Priority;
import com.workflow.engine.task.service.TaskService;
import com.workflow.engine.workflow.entity.Workflow;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Component
@Profile("agile-verify")
@RequiredArgsConstructor
public class AgileVerificationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AgileVerificationRunner.class);

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final SprintService sprintService;
    private final BoardService boardService;
    private final TaskService taskService;
    private final ProjectMemberRepository projectMemberRepository;
    private final OrganizationMemberRepository organizationMemberRepository;
    private final WorkflowRepository workflowRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("========================================");
        log.info("STARTING AGILE VERIFICATION");
        log.info("========================================");

        try {
            verifyAgileWorkflow();
        } catch (Exception e) {
            log.error("Agile Verification Failed", e);
        }

        log.info("========================================");
        log.info("AGILE VERIFICATION COMPLETE");
        log.info("========================================");
    }

    private void verifyAgileWorkflow() {
        // 1. Setup User & Project
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();
        Workflow workflow = workflowRepository.findAll().stream().findFirst().orElseThrow();

        UUID organizationId = organizationMemberRepository.findByUserId(admin.getId())
                .stream()
                .findFirst()
                .map(OrganizationMember::getOrganizationId)
                .orElseThrow(() -> new IllegalStateException("Admin user has no organization membership"));

        Project project = Project.builder()
                .name("Agile Verification Project " + System.currentTimeMillis())
                .organizationId(organizationId) // Assuming single org for admin
                .workflowId(workflow.getId())
                .build();
        project = projectRepository.save(project);

        // Ensure Admin has Project Permissions
        if (projectMemberRepository.findByUserIdAndProjectId(admin.getId(), project.getId()).isEmpty()) {
            projectMemberRepository.save(ProjectMember.builder()
                    .projectId(project.getId())
                    .userId(admin.getId())
                    .role(ProjectRole.PROJECT_ADMIN)
                    .build());
        }

        log.info("1. Project Created: {}", project.getId());

        // 2. Create Board
        Board board = boardService.createBoard(project.getId(), "Scrum Board", BoardType.SCRUM, admin.getId());
        log.info("2. Board Created: {}", board.getId());

        // 3. Create Sprint
        Sprint sprint = sprintService.createSprint(project.getId(), "Sprint 1", "Verify Agile", LocalDate.now(),
                LocalDate.now().plusWeeks(2), admin.getId());
        log.info("3. Sprint Created: {} (Status: {})", sprint.getId(), sprint.getStatus());

        // 4. Create Task
        CreateTaskRequest taskRequest = CreateTaskRequest.builder()
                .title("Agile Task")
                .description("Test Description")
                .priority(Priority.HIGH)
                .build();
        TaskResponse task = taskService.create(project.getId(), taskRequest, admin.getId());
        log.info("4. Task Created: {}", task.getId());

        // 5. Add Task to Sprint
        sprintService.addTaskToSprint(sprint.getId(), UUID.fromString(task.getId()), admin.getId());
        TaskResponse updatedTask = taskService.getById(UUID.fromString(task.getId()), admin.getId());
        if (updatedTask.getSprintId() != null && updatedTask.getSprintId().equals(sprint.getId().toString())) {
            log.info("5. Task Added to Sprint: SUCCESS");
        } else {
            log.error("5. Task Added to Sprint: FAILED");
        }

        // 6. Start Sprint
        sprint = sprintService.startSprint(sprint.getId(), null, null, null, null, admin.getId());
        log.info("6. Sprint Started: Status = {}", sprint.getStatus());
        if (sprint.getStatus() == SprintStatus.ACTIVE) {
            log.info("Sprint Start Verified");
        } else {
            log.error("Sprint Start Failed");
        }

        // 7. Complete Sprint
        sprint = sprintService.completeSprint(sprint.getId(), admin.getId());
        log.info("7. Sprint Completed: Status = {}", sprint.getStatus());
        if (sprint.getStatus() == SprintStatus.CLOSED) {
            log.info("Sprint Completion Verified");
        } else {
            log.error("Sprint Completion Failed");
        }
    }
}

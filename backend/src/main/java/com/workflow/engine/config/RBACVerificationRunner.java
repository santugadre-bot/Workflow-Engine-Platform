package com.workflow.engine.config;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.common.exception.AccessDeniedException;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.ProjectMember;
import com.workflow.engine.rbac.entity.ProjectRole;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.rbac.repository.ProjectMemberRepository;
import com.workflow.engine.task.dto.CreateTaskRequest;
import com.workflow.engine.task.entity.Priority;
import com.workflow.engine.task.service.TaskService;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.Workflow;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.UUID;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class RBACVerificationRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RBACVerificationRunner.class);

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationMemberRepository orgMemberRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskService taskService;
    private final PasswordEncoder passwordEncoder;
    private final WorkflowRepository workflowRepository;
    private final WorkflowStateRepository stateRepository;

    @Override
    public void run(String... args) throws Exception {
        log.info("=================================================");
        log.info("👮 STARTING RBAC VERIFICATION");
        log.info("=================================================");

        try {
            // 1. Setup Organization
            UUID orgId = UUID.randomUUID(); // Mock Org ID for isolation

            // Create and save Organization to satisfy FK constraint
            Organization org = Organization.builder()
                    .name("RBAC Test Org")
                    .ownerId(UUID.randomUUID()) // Mock owner
                    .build();
            // We need to set the ID explicitly if we want to use the specific UUID,
            // but since Organization uses generated ID, we should let it generate and use
            // that.
            // Or if we want to use orgId, we need to set it. Organization extends
            // BaseEntity which has ID.
            org.setId(orgId);
            org = organizationRepository.save(org);

            // 2. Setup Project
            Project project = Project.builder()
                    .name("RBAC Test Project")
                    .organizationId(orgId)
                    .build();
            project = projectRepository.save(project);

            // 3. Setup Workflow (Required for Task Creation)
            Workflow workflow = Workflow.builder()
                    .name("RBAC Workflow")
                    .organizationId(orgId)
                    .build();
            workflow = workflowRepository.save(workflow);
            project.setWorkflowId(workflow.getId());
            project = projectRepository.save(project);

            // Add Start State
            WorkflowState startState = WorkflowState.builder()
                    .workflowId(workflow.getId())
                    .name("Open")
                    .type(StateType.START)
                    .position(0)
                    .build();
            stateRepository.save(startState);

            // 4. Create Users & Assign Roles
            User scrumMaster = createUser("scrum_master", orgId);
            assignProjectRole(scrumMaster, project, ProjectRole.SCRUM_MASTER);

            User developer = createUser("developer", orgId);
            assignProjectRole(developer, project, ProjectRole.DEVELOPER);

            User viewer = createUser("viewer", orgId);
            assignProjectRole(viewer, project, ProjectRole.VIEWER);

            log.info("✅ Users and Roles setup complete");

            // 5. Test Scenarios

            // TEST A: Developer Creates Task -> SUCCESS
            testCreateTask(developer, project.getId(), "Dev Task", true);

            // TEST B: Viewer Creates Task -> FAIL
            testCreateTask(viewer, project.getId(), "Viewer Task", false);

            // TEST C: Developer Deletes Task -> FAIL (Dev has no delete permission)
            // Create a task first (as Scrum Master to be safe)
            UUID taskToDeleteId = UUID.fromString(taskService.create(project.getId(),
                    CreateTaskRequest.builder().title("Task to Delete").build(),
                    scrumMaster.getId()).getId());

            testDeleteTask(developer, taskToDeleteId, false);

            // TEST D: Scrum Master Deletes Task -> SUCCESS
            // Re-create task if needed, or make a new one
            UUID taskToDeleteId2 = UUID.fromString(taskService.create(project.getId(),
                    CreateTaskRequest.builder().title("Task to Delete 2").build(),
                    scrumMaster.getId()).getId());
            testDeleteTask(scrumMaster, taskToDeleteId2, true);

            log.info("=================================================");
            log.info("🎉 RBAC VERIFICATION COMPLETED SUCCESSFULLY");
            log.info("=================================================");

        } catch (Exception e) {
            log.error("❌ RBAC Verification Failed", e);
        }
    }

    private User createUser(String username, UUID orgId) {
        String email = username + "@rbac.test";
        if (userRepository.findByEmail(email).isPresent()) {
            return userRepository.findByEmail(email).get();
        }
        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode("password"))
                .displayName(username)
                .build();
        user = userRepository.save(user);

        // Add to Org
        orgMemberRepository.save(OrganizationMember.builder()
                .userId(user.getId())
                .organizationId(orgId)
                .role(OrganizationRole.MEMBER)
                .build());
        return user;
    }

    private void assignProjectRole(User user, Project project, ProjectRole role) {
        if (!projectMemberRepository.existsByUserIdAndProjectId(user.getId(), project.getId())) {
            projectMemberRepository.save(ProjectMember.builder()
                    .userId(user.getId())
                    .projectId(project.getId())
                    .role(role)
                    .build());
        }
    }

    private void testCreateTask(User user, UUID projectId, String title, boolean expectSuccess) {
        log.info("🔹 Testing CREATE_ISSUE for {} ({}) - Expect Success: {}",
                user.getDisplayName(), "Unknown Role", expectSuccess);
        try {
            taskService.create(projectId, CreateTaskRequest.builder()
                    .title(title)
                    .priority(Priority.MEDIUM)
                    .build(), user.getId());
            if (expectSuccess) {
                log.info("✅ SUCCESS: Task Created as expected.");
            } else {
                log.error("❌ FAILURE: Task Created but should have failed!");
            }
        } catch (AccessDeniedException e) {
            if (!expectSuccess) {
                log.info("✅ SUCCESS: Access Denied as expected.");
            } else {
                log.error("❌ FAILURE: Access Denied but should have succeeded!");
            }
        } catch (Exception e) {
            log.error("❌ FAILURE: Unexpected error", e);
        }
    }

    private void testDeleteTask(User user, UUID taskId, boolean expectSuccess) {
        log.info("🔹 Testing DELETE_ISSUE for {} - Expect Success: {}",
                user.getDisplayName(), expectSuccess);
        try {
            taskService.delete(taskId, user.getId());
            if (expectSuccess) {
                log.info("✅ SUCCESS: Task Deleted as expected.");
            } else {
                log.error("❌ FAILURE: Task Deleted but should have failed!");
            }
        } catch (AccessDeniedException e) {
            if (!expectSuccess) {
                log.info("✅ SUCCESS: Access Denied as expected.");
            } else {
                log.error("❌ FAILURE: Access Denied but should have succeeded!");
            }
        } catch (Exception e) {
            log.error("❌ FAILURE: Unexpected error", e);
        }
    }
}

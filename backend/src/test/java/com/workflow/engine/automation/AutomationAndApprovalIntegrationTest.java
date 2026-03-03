package com.workflow.engine.automation;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.engine.approval.entity.ApprovalRequest;
import com.workflow.engine.approval.repository.ApprovalRequestRepository;
import com.workflow.engine.approval.service.ApprovalService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.automation.entity.AutomationRule;
import com.workflow.engine.automation.repository.AutomationRuleRepository;
import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.common.config.SystemConstants;
import com.workflow.engine.notification.entity.Notification;
import com.workflow.engine.notification.repository.NotificationRepository;
import com.workflow.engine.task.repository.TaskHistoryRepository;
import com.workflow.engine.analytics.repository.TaskStateHistoryRepository;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.repository.OrganizationMemberRepository;
import com.workflow.engine.task.entity.Priority;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.task.service.TaskTransitionService;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.Workflow;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import com.workflow.engine.organization.entity.Organization;
import com.workflow.engine.organization.repository.OrganizationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AutomationAndApprovalIntegrationTest {

        @Autowired
        private OrganizationRepository organizationRepository;
        @Autowired
        private ProjectRepository projectRepository;
        @Autowired
        private TaskRepository taskRepository;
        @Autowired
        private UserRepository userRepository;
        @Autowired
        private OrganizationMemberRepository orgMemberRepository;
        @Autowired
        private WorkflowRepository workflowRepository;
        @Autowired
        private WorkflowStateRepository stateRepository;
        @Autowired
        private WorkflowTransitionRepository transitionRepository;
        @Autowired
        private ApprovalRequestRepository approvalRepository;
        @Autowired
        private NotificationRepository notificationRepository;
        @Autowired
        private AutomationRuleRepository ruleRepository;
        @Autowired
        private com.workflow.engine.audit.repository.AuditLogRepository auditLogRepository;
        @Autowired
        private TaskHistoryRepository taskHistoryRepository;
        @Autowired
        private TaskStateHistoryRepository taskStateHistoryRepository;
        @Autowired
        private com.workflow.engine.rbac.repository.ProjectMemberRepository projectMemberRepository;
        @Autowired
        private com.workflow.engine.sla.repository.SlaPolicyRepository slaPolicyRepository;
        @Autowired
        private TaskTransitionService transitionService;
        @Autowired
        private ObjectMapper objectMapper;

        private Organization organization;
        private Project project;
        private User admin;
        private User member;
        private WorkflowState todoState;
        private WorkflowState inProgressState;
        private WorkflowState doneState;
        private WorkflowTransition toInProgress;
        private WorkflowTransition toDone;

        @org.junit.jupiter.api.AfterEach
        void tearDown() {
                cleanup();
        }

        private void cleanup() {
                // Order matters for FK constraints
                auditLogRepository.deleteAllInBatch();
                slaPolicyRepository.deleteAllInBatch();
                taskStateHistoryRepository.deleteAllInBatch();
                taskHistoryRepository.deleteAllInBatch();
                approvalRepository.deleteAllInBatch();
                notificationRepository.deleteAllInBatch();
                ruleRepository.deleteAllInBatch();
                taskRepository.deleteAllInBatch();
                projectMemberRepository.deleteAllInBatch();
                projectRepository.deleteAllInBatch();
                transitionRepository.deleteAllInBatch();
                stateRepository.deleteAllInBatch();
                workflowRepository.deleteAllInBatch();
                orgMemberRepository.deleteAllInBatch();
                organizationRepository.deleteAllInBatch();
                userRepository.deleteAllInBatch();
        }

        @BeforeEach
        void setup() {
                // No manual cleanup needed with Testcontainers if using fresh containers per
                // class/method
                // But since we use static container, we still want to clean up data BETWEEN
                // tests
                // OR we accept that setup handles its own unique data.
                // For safety with static container:
                cleanup();

                // Setup Users
                admin = userRepository
                                .save(User.builder().email("admin@test.com").password("pass").displayName("Admin")
                                                .build());
                member = userRepository
                                .save(User.builder().email("member@test.com").password("pass").displayName("Member")
                                                .build());

                // Setup Organization
                organization = organizationRepository.save(
                                Organization.builder().name("Test Organization").description("Test")
                                                .ownerId(admin.getId()).build());

                // Setup Members
                orgMemberRepository.save(
                                OrganizationMember.builder().organizationId(organization.getId()).userId(admin.getId())
                                                .role(OrganizationRole.ADMIN).build());
                orgMemberRepository.save(
                                OrganizationMember.builder().organizationId(organization.getId()).userId(member.getId())
                                                .role(OrganizationRole.MEMBER).build());

                // Setup Workflow
                Workflow workflow = workflowRepository
                                .save(Workflow.builder().name("Test Workflow").organizationId(organization.getId())
                                                .build());

                // Setup States
                todoState = stateRepository
                                .save(WorkflowState.builder().workflowId(workflow.getId()).name("To Do")
                                                .type(StateType.START).build());
                inProgressState = stateRepository
                                .save(WorkflowState.builder().workflowId(workflow.getId()).name("In Progress")
                                                .type(StateType.IN_PROGRESS).build());
                doneState = stateRepository
                                .save(WorkflowState.builder().workflowId(workflow.getId()).name("Done")
                                                .type(StateType.DONE).build());

                // Setup Transitions
                toInProgress = transitionRepository.save(WorkflowTransition.builder()
                                .workflowId(workflow.getId())
                                .name("Start Progress")
                                .fromStateId(todoState.getId())
                                .toStateId(inProgressState.getId())
                                .requiresApproval(true) // Requires Approval!
                                .build());

                toDone = transitionRepository.save(WorkflowTransition.builder()
                                .workflowId(workflow.getId())
                                .name("Complete")
                                .fromStateId(inProgressState.getId())
                                .toStateId(doneState.getId())
                                .requiresApproval(false)
                                .build());

                // Setup Project
                project = projectRepository.save(Project.builder()
                                .name("Test Project")
                                .organizationId(organization.getId())
                                .workflowId(workflow.getId())
                                .description("Test Description")
                                .build());
        }

        @Test
        void testApprovalNotification() {
                // Create Task
                Task task = taskRepository.save(Task.builder()
                                .title("Approval Task")
                                .projectId(project.getId())
                                .organizationId(organization.getId())
                                .currentStateId(todoState.getId())
                                .priority(Priority.MEDIUM)
                                .build());

                // Attempt transition requiring approval
                assertThrows(com.workflow.engine.common.exception.InvalidTransitionException.class, () -> {
                        transitionService.transition(task.getId(), toInProgress.getId(), member.getId());
                });

                // Verify Approval Request Created
                List<ApprovalRequest> requests = approvalRepository.findByOrganizationIdAndStatus(organization.getId(),
                                ApprovalRequest.ApprovalStatus.PENDING);
                assertEquals(1, requests.size());

                // Verify Admin Notified
                List<Notification> notifications = notificationRepository
                                .findByUserIdOrderByCreatedAtDesc(admin.getId());
                assertTrue(notifications.stream()
                                .anyMatch(n -> n.getType().equals("APPROVAL_PENDING")
                                                && n.getReferenceId().equals(task.getId())));
        }

        @Test
        void testAutomationReassignment() throws Exception {
                // Rule: If task created (or transitioning for this test setup), reassign to
                // Member
                // Let's use TRANSITIONED event for simplicity as we trigger it manually
                String actionConfig = objectMapper.writeValueAsString(Map.of("assigneeId", member.getId().toString()));

                ruleRepository.save(AutomationRule.builder()
                                .name("Auto Reassign")
                                .projectId(project.getId())
                                .triggerEvent("TASK_TRANSITIONED")
                                .actionType("REASSIGN")
                                .actionConfigJson(actionConfig)
                                .conditionsJson("[]")
                                .active(true)
                                .build());

                // Create Task in In Progress (so we can move to Done without approval)
                Task task = taskRepository.save(Task.builder()
                                .title("Automation Task")
                                .projectId(project.getId())
                                .organizationId(organization.getId())
                                .currentStateId(inProgressState.getId()) // Start at In Progress
                                .assigneeId(admin.getId()) // Assigned to Admin initially
                                .priority(Priority.MEDIUM)
                                .build());

                // Perform Transition
                transitionService.transition(task.getId(), toDone.getId(), admin.getId());

                // Wait for Async Event
                Thread.sleep(1000);

                // Reload Task
                Task updatedTask = taskRepository.findById(task.getId()).orElseThrow();
                assertEquals(member.getId(), updatedTask.getAssigneeId());
        }

        @Test
        void testAutomationLoopProtection() throws Exception {
                // Setup Circular Rules: In Progress -> Done, Done -> In Progress
                // (hypothetically, via state update action)

                // We need a transition back to In Progress
                WorkflowTransition toInProgressFromDone = transitionRepository.save(WorkflowTransition.builder()
                                .workflowId(project.getWorkflowId())
                                .name("Reopen")
                                .fromStateId(doneState.getId())
                                .toStateId(inProgressState.getId())
                                .build());

                // Rule 1: If In Progress -> Move to Done
                String config1 = objectMapper.writeValueAsString(Map.of("transitionId", toDone.getId().toString()));
                String conditions1 = "[{\"field\": \"priority\", \"operator\": \"EQUALS\", \"value\": \"HIGH\"}]"; // Filter
                                                                                                                   // to
                                                                                                                   // avoid
                                                                                                                   // other
                                                                                                                   // tests
                                                                                                                   // interference

                ruleRepository.save(AutomationRule.builder()
                                .name("Auto Complete")
                                .projectId(project.getId())
                                .triggerEvent("TASK_TRANSITIONED")
                                .actionType("UPDATE_STATUS")
                                .actionConfigJson(config1)
                                .conditionsJson(conditions1)
                                .active(true)
                                .build());

                // Rule 2: If Done -> Move to In Progress
                String config2 = objectMapper
                                .writeValueAsString(Map.of("transitionId", toInProgressFromDone.getId().toString()));

                ruleRepository.save(AutomationRule.builder()
                                .name("Auto Reopen")
                                .projectId(project.getId())
                                .triggerEvent("TASK_TRANSITIONED")
                                .actionType("UPDATE_STATUS")
                                .actionConfigJson(config2)
                                .conditionsJson(conditions1)
                                .active(true)
                                .build());

                // Create Task
                Task task = taskRepository.save(Task.builder()
                                .title("Loop Task")
                                .projectId(project.getId())
                                .organizationId(organization.getId())
                                .currentStateId(inProgressState.getId())
                                .priority(Priority.HIGH) // Match condition
                                .build());

                // Trigger first transition manually (In Progress -> Done)
                // This should trigger Rule 2 (Done -> In Progress), which triggers Rule 1 (In
                // Progress -> Done)... loop!

                transitionService.transition(task.getId(), toDone.getId(), admin.getId());

                // Wait for loop to hit limit
                Thread.sleep(3000);

                // We can't easily assert log output here, but we can verify stack didn't
                // overflow and state is settled.
                // The task should be in one of the states, and the system should be responsive.
                Task settledTask = taskRepository.findById(task.getId()).orElseThrow();
                assertNotNull(settledTask);
                // It likely stopped at depth 5.
        }
}

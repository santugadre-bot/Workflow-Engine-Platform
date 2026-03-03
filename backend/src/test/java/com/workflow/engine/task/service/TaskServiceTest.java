package com.workflow.engine.task.service;

import com.workflow.engine.audit.service.AuditService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.task.dto.TaskResponse;
import com.workflow.engine.task.entity.Priority;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import com.workflow.engine.task.service.TaskTransitionService;
import com.workflow.engine.workflow.service.WorkflowService;
import com.workflow.engine.project.service.ProjectService;
import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.core.user.service.UserService;
import com.workflow.engine.common.service.WebSocketService;
import com.workflow.engine.notification.service.NotificationService;
import org.springframework.context.ApplicationEventPublisher;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import com.workflow.engine.task.service.TaskCommentService;
import com.workflow.engine.task.service.TaskHistoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private WorkflowStateRepository stateRepository;

    @Mock
    private WorkflowTransitionRepository transitionRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PermissionService permissionService;

    @Mock
    private AuditService auditService;

    @Mock
    private TaskTransitionService transitionService;

    @Mock
    private WorkflowService workflowService;

    @Mock
    private ProjectService projectService;

    @Mock
    private AutomationService automationService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private UserService userService;

    @Mock
    private WebSocketService webSocketService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private ProjectPermissionService projectPermissionService;

    @Mock
    private TaskCommentService taskCommentService;

    @Mock
    private TaskHistoryService taskHistoryService;

    @Mock
    private com.workflow.engine.task.repository.TaskAttachmentRepository attachmentRepository;

    @Mock
    private com.workflow.engine.analytics.service.AnalyticsService analyticsService;

    @InjectMocks
    private TaskService taskService;

    private Task task;
    private User user;
    private WorkflowState state;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("test@example.com")
                .displayName("Test User")
                .build();
        user.setId(UUID.randomUUID());

        state = WorkflowState.builder()
                .name("To Do")
                .type(StateType.START)
                .build();
        state.setId(UUID.randomUUID());

        task = Task.builder()
                .title("Test Task")
                .description("Description")
                .priority(Priority.MEDIUM)
                .currentStateId(state.getId())
                .projectId(UUID.randomUUID())
                .organizationId(UUID.randomUUID())
                .build();
        task.setId(UUID.randomUUID());
        task.setBlocked(false);

        // Common stubbing
        lenient().when(taskCommentService.getCommentCount(any())).thenReturn(0L);
        lenient().when(attachmentRepository.countByTaskId(any())).thenReturn(0L);
    }

    @Test
    void toggleBlock_ShouldBlockTask_WhenNotBlocked() {
        // Arrange
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stateRepository.findById(state.getId())).thenReturn(Optional.of(state));
        when(transitionRepository.findByFromStateId(any())).thenReturn(new ArrayList<>());

        // Act
        TaskResponse response = taskService.toggleBlock(task.getId(), user.getId());

        // Assert
        assertTrue(response.isBlocked());
        verify(taskRepository).save(task);
        verify(permissionService).checkPermission(user.getId(), task.getOrganizationId(), OrganizationRole.MEMBER);
        verify(auditService).log(eq(user.getId()), eq("TASK_BLOCKED"), anyString(), eq(task.getId()),
                eq(task.getOrganizationId()), anyString());
    }

    @Test
    void toggleBlock_ShouldUnblockTask_WhenBlocked() {
        // Arrange
        task.setBlocked(true);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(stateRepository.findById(state.getId())).thenReturn(Optional.of(state));
        when(transitionRepository.findByFromStateId(any())).thenReturn(new ArrayList<>());

        // Act
        TaskResponse response = taskService.toggleBlock(task.getId(), user.getId());

        // Assert
        assertFalse(response.isBlocked());
        verify(taskRepository).save(task);
        verify(auditService).log(eq(user.getId()), eq("TASK_UNBLOCKED"), anyString(), eq(task.getId()),
                eq(task.getOrganizationId()), anyString());
    }

    @Test
    void toggleBlock_ShouldThrowException_WhenTaskNotFound() {
        // Arrange
        UUID nonExistentId = UUID.randomUUID();
        when(taskRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> taskService.toggleBlock(nonExistentId, user.getId()));
    }
}

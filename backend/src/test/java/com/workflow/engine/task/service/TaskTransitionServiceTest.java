package com.workflow.engine.task.service;

import com.workflow.engine.analytics.service.AnalyticsService;
import com.workflow.engine.approval.service.ApprovalService;
import com.workflow.engine.audit.service.AuditService;
import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.notification.service.NotificationService;
import com.workflow.engine.common.exception.InvalidTransitionException;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.task.entity.Task;
import com.workflow.engine.task.entity.TaskHistory;
import com.workflow.engine.task.repository.TaskHistoryRepository;
import com.workflow.engine.task.repository.TaskRepository;
import com.workflow.engine.workflow.entity.WorkflowTransition;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TaskTransitionServiceTest {

    @Mock
    private TaskRepository taskRepository;
    @Mock
    private TaskHistoryRepository historyRepository;
    @Mock
    private WorkflowTransitionRepository transitionRepository;
    @Mock
    private WorkflowStateRepository stateRepository;
    @Mock
    private PermissionService permissionService;
    @Mock
    private AuditService auditService;
    @Mock
    private AnalyticsService analyticsService;
    @Mock
    private ApprovalService approvalService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private AutomationService automationService;
    @Mock
    private org.springframework.context.ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private TaskTransitionService transitionService;

    private UUID userId;
    private UUID taskId;
    private UUID transitionId;
    private UUID organizationId;
    private UUID fromStateId;
    private UUID toStateId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        taskId = UUID.randomUUID();
        transitionId = UUID.randomUUID();
        organizationId = UUID.randomUUID();
        fromStateId = UUID.randomUUID();
        toStateId = UUID.randomUUID();
    }

    @Test
    void transition_ShouldUpdateState_WhenTransitionIsValid() {
        Task task = new Task();
        task.setId(taskId);
        task.setProjectId(UUID.randomUUID());
        task.setOrganizationId(organizationId);
        task.setCurrentStateId(fromStateId);

        WorkflowTransition transition = new WorkflowTransition();
        transition.setId(transitionId);
        transition.setName("Move to Done");
        transition.setFromStateId(fromStateId);
        transition.setToStateId(toStateId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(transitionRepository.findById(transitionId)).thenReturn(Optional.of(transition));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        Task updatedTask = transitionService.transition(taskId, transitionId, userId);

        assertEquals(toStateId, updatedTask.getCurrentStateId());
        verify(permissionService).checkPermission(userId, organizationId, OrganizationRole.MEMBER);
        verify(historyRepository).save(any(TaskHistory.class));
        verify(auditService).log(any(), any(), any(), any(), any(), any());
    }

    @Test
    void transition_ShouldThrowException_WhenStatesMismatch() {
        Task task = new Task();
        task.setId(taskId);
        task.setProjectId(UUID.randomUUID());
        task.setOrganizationId(organizationId);
        task.setCurrentStateId(UUID.randomUUID()); // Different state

        WorkflowTransition transition = new WorkflowTransition();
        transition.setId(transitionId);
        transition.setFromStateId(fromStateId);
        transition.setToStateId(toStateId);

        when(taskRepository.findById(taskId)).thenReturn(Optional.of(task));
        when(transitionRepository.findById(transitionId)).thenReturn(Optional.of(transition));

        assertThrows(InvalidTransitionException.class,
                () -> transitionService.transition(taskId, transitionId, userId));
    }
}

package com.workflow.engine.workflow.service;

import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.workflow.dto.AddStateRequest;
import com.workflow.engine.workflow.dto.CreateWorkflowRequest;
import com.workflow.engine.workflow.dto.WorkflowResponse;
import com.workflow.engine.workflow.entity.StateType;
import com.workflow.engine.workflow.entity.Workflow;
import com.workflow.engine.workflow.entity.WorkflowState;
import com.workflow.engine.workflow.repository.WorkflowRepository;
import com.workflow.engine.workflow.repository.WorkflowStateRepository;
import com.workflow.engine.workflow.repository.WorkflowTransitionRepository;
import com.workflow.engine.workflow.validation.WorkflowValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private WorkflowRepository workflowRepository;
    @Mock
    private WorkflowStateRepository stateRepository;
    @Mock
    private WorkflowTransitionRepository transitionRepository;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private PermissionService permissionService;
    @Mock
    private WorkflowValidator validator;

    @InjectMocks
    private WorkflowService workflowService;

    private UUID userId;
    private UUID organizationId;
    private UUID workflowId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        organizationId = UUID.randomUUID();
        workflowId = UUID.randomUUID();
    }

    @Test
    void create_ShouldCreateWorkflow_WhenValid() {
        CreateWorkflowRequest request = new CreateWorkflowRequest();
        request.setName("Test Workflow");
        request.setDescription("Description");

        Workflow workflow = Workflow.builder()
                .name(request.getName())
                .description(request.getDescription())
                .organizationId(organizationId)
                .active(false)
                .build();
        workflow.setId(workflowId);
        workflow.setCreatedAt(java.time.LocalDateTime.now());

        when(workflowRepository.save(any(Workflow.class))).thenReturn(workflow);

        WorkflowResponse response = workflowService.create(organizationId, request, userId);

        assertNotNull(response);
        assertEquals(workflowId.toString(), response.getId());
        verify(permissionService).checkPermission(userId, organizationId, OrganizationRole.ADMIN);
        verify(workflowRepository).save(any(Workflow.class));
    }

    @Test
    void addState_ShouldAddState_WhenWorkflowIsNotActive() {
        Workflow workflow = Workflow.builder()
                .organizationId(organizationId)
                .active(false)
                .build();
        workflow.setId(workflowId);

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflow));
        when(stateRepository.save(any(WorkflowState.class))).thenAnswer(invocation -> {
            WorkflowState state = invocation.getArgument(0);
            state.setId(UUID.randomUUID());
            return state;
        });

        AddStateRequest request = new AddStateRequest();
        request.setName("In Progress");
        request.setType(StateType.IN_PROGRESS);

        WorkflowResponse.StateResponse response = workflowService.addState(workflowId, request, userId);

        assertNotNull(response);
        assertEquals("In Progress", response.getName());
        verify(permissionService).checkPermission(userId, organizationId, OrganizationRole.ADMIN);
    }

    @Test
    void addState_ShouldThrowException_WhenWorkflowIsActive() {
        Workflow workflow = Workflow.builder()
                .organizationId(organizationId)
                .active(true)
                .build();
        workflow.setId(workflowId);

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflow));

        AddStateRequest request = new AddStateRequest();
        request.setName("Done");
        request.setType(StateType.END);

        assertThrows(BusinessException.class, () -> workflowService.addState(workflowId, request, userId));
    }

    @Test
    void validateAndActivate_ShouldActivate_WhenValidationPasses() {
        Workflow workflow = Workflow.builder()
                .organizationId(organizationId)
                .active(false)
                .build();
        workflow.setId(workflowId);
        workflow.setCreatedAt(java.time.LocalDateTime.now());

        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflow));
        when(stateRepository.findByWorkflowIdOrderByPositionAsc(workflowId)).thenReturn(Collections.emptyList());
        when(transitionRepository.findByWorkflowId(workflowId)).thenReturn(Collections.emptyList());
        when(validator.validate(anyList(), anyList())).thenReturn(Collections.emptyList());
        when(workflowRepository.save(any(Workflow.class))).thenReturn(workflow);

        WorkflowResponse response = workflowService.validateAndActivate(workflowId, userId);

        assertTrue(response.isActive());
        verify(workflowRepository).save(workflow);
    }
}

package com.workflow.engine.workflow.service;

import com.workflow.engine.common.exception.BusinessException;
import com.workflow.engine.common.exception.ResourceNotFoundException;
import com.workflow.engine.project.entity.Project;
import com.workflow.engine.project.repository.ProjectRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import com.workflow.engine.workflow.dto.*;
import com.workflow.engine.workflow.entity.*;
import com.workflow.engine.workflow.repository.*;
import com.workflow.engine.workflow.validation.WorkflowValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for managing Workflow definitions and their components (States,
 * Transitions).
 * <p>
 * This service handles the lifecycle of a workflow, including creation,
 * modification,
 * validation, and activation. It enforces business rules such as preventing
 * modification
 * of active workflows and ensuring data integrity.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class WorkflowService {

    private final WorkflowRepository workflowRepository;
    private final WorkflowStateRepository stateRepository;
    private final WorkflowTransitionRepository transitionRepository;
    private final ProjectRepository projectRepository;
    private final PermissionService permissionService;
    private final WorkflowValidator validator;

    /**
     * Creates a new empty workflow.
     *
     * @param organizationId ID of the organization
     * @param request        Creation details
     * @param userId         ID of the user creating the workflow
     * @return Created workflow response
     */
    @Transactional
    public WorkflowResponse create(UUID organizationId, CreateWorkflowRequest request, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.ADMIN);

        Workflow workflow = Workflow.builder()
                .name(request.getName())
                .description(request.getDescription())
                .organizationId(organizationId)
                .build();
        workflow = workflowRepository.save(workflow);
        return toFullResponse(workflow, userId);
    }

    /**
     * Adds a new state to a workflow.
     * <p>
     * Cannot be performed on an active workflow.
     * </p>
     *
     * @param workflowId ID of the workflow
     * @param request    State details
     * @param userId     ID of the acting user
     * @return Default response with the new state
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public WorkflowResponse.StateResponse addState(UUID workflowId, AddStateRequest request, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot modify an active workflow");
        }

        int position = request.getPosition() != null
                ? request.getPosition()
                : stateRepository.countByWorkflowId(workflowId);

        WorkflowState state = WorkflowState.builder()
                .name(request.getName())
                .type(request.getType())
                .position(position)
                .positionX(request.getPositionX() != null ? request.getPositionX() : 0.0)
                .positionY(request.getPositionY() != null ? request.getPositionY() : 0.0)
                .workflowId(workflowId)
                .build();
        state = stateRepository.save(state);

        return WorkflowResponse.StateResponse.builder()
                .id(state.getId().toString())
                .name(state.getName())
                .type(state.getType().name())
                .position(state.getPosition())
                .positionX(state.getPositionX())
                .positionY(state.getPositionY())
                .wipLimit(state.getWipLimit())
                .build();
    }

    /**
     * Adds a transition between two states.
     *
     * @param workflowId ID of the workflow
     * @param request    Transition details (fromState, toState)
     * @param userId     ID of the acting user
     * @return Created transition response
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public WorkflowResponse.TransitionResponse addTransition(UUID workflowId, AddTransitionRequest request,
            UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot modify an active workflow");
        }

        // Verify both states exist and belong to this workflow
        stateRepository.findById(request.getFromStateId())
                .filter(s -> s.getWorkflowId().equals(workflowId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowState", "id", request.getFromStateId()));
        stateRepository.findById(request.getToStateId())
                .filter(s -> s.getWorkflowId().equals(workflowId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowState", "id", request.getToStateId()));

        WorkflowTransition transition = WorkflowTransition.builder()
                .name(request.getName())
                .fromStateId(request.getFromStateId())
                .toStateId(request.getToStateId())
                .requiresApproval(request.isRequiresApproval())
                .workflowId(workflowId)
                .build();
        transition = transitionRepository.save(transition);

        return WorkflowResponse.TransitionResponse.builder()
                .id(transition.getId().toString())
                .name(transition.getName())
                .fromStateId(transition.getFromStateId().toString())
                .toStateId(transition.getToStateId().toString())
                .requiresApproval(transition.isRequiresApproval())
                .build();
    }

    /**
     * Validates the workflow structure and marks it as active.
     * <p>
     * Once active, a workflow can be assigned to projects but can no longer be
     * modified
     * (states/transitions cannot be added/removed).
     * </p>
     *
     * @param workflowId ID of the workflow
     * @param userId     ID of the acting user
     * @return Updated workflow response
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public WorkflowResponse validateAndActivate(UUID workflowId, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        List<WorkflowState> states = stateRepository.findByWorkflowIdOrderByPositionAsc(workflowId);
        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowId(workflowId);

        List<String> errors = validator.validate(states, transitions);
        if (!errors.isEmpty()) {
            throw new BusinessException("Workflow validation failed: " + String.join("; ", errors));
        }

        workflow.setActive(true);
        workflowRepository.save(workflow);

        return toFullResponse(workflow, userId);
    }

    /**
     * Assigns an active workflow to a project.
     *
     * @param workflowId ID of the workflow
     * @param projectId  ID of the project
     * @param userId     ID of the acting user
     */
    @Transactional
    public void assignToProject(UUID workflowId, UUID projectId, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (!workflow.isActive()) {
            throw new BusinessException("Workflow must be active before assigning to a project");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        if (!project.getOrganizationId().equals(workflow.getOrganizationId())) {
            throw new BusinessException("Workflow and project must belong to the same organization");
        }

        project.setWorkflowId(workflowId);
        projectRepository.save(project);
    }

    /**
     * Retrieves a workflow by ID.
     *
     * @param workflowId ID of the workflow
     * @param userId     ID of the acting user (for permission check)
     * @return Workflow details
     */
    @Cacheable(value = "workflows", key = "#workflowId + '_' + #userId")
    public WorkflowResponse getById(UUID workflowId, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.MEMBER);
        return toFullResponse(workflow, userId);
    }

    /**
     * Lists all workflows in an organization.
     *
     * @param organizationId ID of the organization
     * @param userId         ID of the acting user
     * @return List of workflows
     */
    @Cacheable(value = "workflowsByOrg", key = "#organizationId + '_' + #userId")
    public List<WorkflowResponse> listByOrganization(UUID organizationId, UUID userId) {
        permissionService.checkPermission(userId, organizationId, OrganizationRole.MEMBER);
        return workflowRepository.findByOrganizationId(organizationId).stream()
                .map(wf -> toFullResponse(wf, userId))
                .toList();
    }

    /** Used internally by TaskEngine to get the START state */
    @Cacheable(value = "workflowStartState", key = "#workflowId")
    public WorkflowState getStartState(UUID workflowId) {
        return stateRepository.findByWorkflowIdOrderByPositionAsc(workflowId).stream()
                .filter(s -> s.getType() == StateType.START)
                .findFirst()
                .orElseThrow(() -> new BusinessException("Workflow has no START state"));
    }

    private Workflow getWorkflowOrThrow(UUID workflowId) {
        return workflowRepository.findById(workflowId)
                .orElseThrow(() -> new ResourceNotFoundException("Workflow", "id", workflowId));
    }

    /**
     * Updates workflow metadata.
     *
     * @param workflowId ID of the workflow
     * @param request    Update details
     * @param userId     ID of the acting user
     * @return Updated workflow response
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public WorkflowResponse update(UUID workflowId, CreateWorkflowRequest request, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        workflow.setName(request.getName());
        workflow.setDescription(request.getDescription());
        workflow = workflowRepository.save(workflow);

        return toFullResponse(workflow, userId);
    }

    /**
     * Deletes a workflow.
     *
     * @param workflowId ID of the workflow
     * @param userId     ID of the acting user
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public void delete(UUID workflowId, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot delete an active workflow. Unassign it from projects first.");
        }

        workflowRepository.delete(workflow);
    }

    /**
     * Deletes a state from a workflow.
     *
     * @param workflowId ID of the workflow
     * @param stateId    ID of the state
     * @param userId     ID of the acting user
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public void deleteState(UUID workflowId, UUID stateId, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot modify an active workflow");
        }

        WorkflowState state = stateRepository.findById(stateId)
                .filter(s -> s.getWorkflowId().equals(workflowId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowState", "id", stateId));

        if (state.getType() == StateType.START) {
            throw new BusinessException("Cannot delete the START state");
        }

        // Transitions from/to this state will be deleted by cascade or manually
        transitionRepository.deleteByFromStateId(stateId);
        transitionRepository.deleteByToStateId(stateId);
        stateRepository.delete(state);
    }

    /**
     * Deletes a transition.
     *
     * @param workflowId   ID of the workflow
     * @param transitionId ID of the transition
     * @param userId       ID of the acting user
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public void deleteTransition(UUID workflowId, UUID transitionId, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot modify an active workflow");
        }

        WorkflowTransition transition = transitionRepository.findById(transitionId)
                .filter(t -> t.getWorkflowId().equals(workflowId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransition", "id", transitionId));

        transitionRepository.delete(transition);
    }

    /**
     * Updates an existing transition.
     *
     * @param workflowId   ID of the workflow
     * @param transitionId ID of the transition
     * @param request      Update details
     * @param userId       ID of the acting user
     * @return Updated transition response
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public WorkflowResponse.TransitionResponse updateTransition(UUID workflowId, UUID transitionId,
            AddTransitionRequest request, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot modify an active workflow");
        }

        WorkflowTransition transition = transitionRepository.findById(transitionId)
                .filter(t -> t.getWorkflowId().equals(workflowId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowTransition", "id", transitionId));

        transition.setName(request.getName());
        transition.setRequiresApproval(request.isRequiresApproval());
        transition = transitionRepository.save(transition);

        return WorkflowResponse.TransitionResponse.builder()
                .id(transition.getId().toString())
                .name(transition.getName())
                .fromStateId(transition.getFromStateId().toString())
                .toStateId(transition.getToStateId().toString())
                .requiresApproval(transition.isRequiresApproval())
                .build();
    }

    /**
     * Batch updates state positions.
     *
     * @param workflowId ID of the workflow
     * @param positions  List of position updates
     * @param userId     ID of the acting user
     */
    @Transactional
    @CacheEvict(value = { "workflows", "workflowsByOrg", "workflowStartState" }, allEntries = true)
    public void updateStatePositions(UUID workflowId, List<UpdateStatePositionRequest> positions, UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        // Collect all states to update, then batch-save in one call
        List<WorkflowState> toUpdate = positions.stream()
                .map(positionRequest -> {
                    WorkflowState state = stateRepository.findById(positionRequest.getStateId())
                            .filter(s -> s.getWorkflowId().equals(workflowId))
                            .orElseThrow(
                                    () -> new ResourceNotFoundException("WorkflowState", "id",
                                            positionRequest.getStateId()));
                    state.setPositionX(positionRequest.getPositionX());
                    state.setPositionY(positionRequest.getPositionY());
                    return state;
                })
                .toList();
        stateRepository.saveAll(toUpdate);
    }

    /**
     * Updates a state's properties.
     *
     * @param workflowId ID of the workflow
     * @param stateId    ID of the state
     * @param request    Update details
     * @param userId     ID of the acting user
     * @return Updated state response
     */
    @Transactional
    public WorkflowResponse.StateResponse updateState(UUID workflowId, UUID stateId, UpdateStateRequest request,
            UUID userId) {
        Workflow workflow = getWorkflowOrThrow(workflowId);
        permissionService.checkPermission(userId, workflow.getOrganizationId(), OrganizationRole.ADMIN);

        if (workflow.isActive()) {
            throw new BusinessException("Cannot modify an active workflow");
        }

        WorkflowState state = stateRepository.findById(stateId)
                .filter(s -> s.getWorkflowId().equals(workflowId))
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowState", "id", stateId));

        // Prevent changing START state type
        if (state.getType() == StateType.START && request.getType() != StateType.START) {
            throw new BusinessException("Cannot change the type of the START state");
        }

        state.setName(request.getName());
        state.setType(request.getType());
        state = stateRepository.save(state);

        return WorkflowResponse.StateResponse.builder()
                .id(state.getId().toString())
                .name(state.getName())
                .type(state.getType().name())
                .position(state.getPosition())
                .wipLimit(state.getWipLimit())
                .build();
    }

    private WorkflowResponse toFullResponse(Workflow workflow, UUID userId) {
        List<WorkflowState> states = stateRepository.findByWorkflowIdOrderByPositionAsc(workflow.getId());
        List<WorkflowTransition> transitions = transitionRepository.findByWorkflowId(workflow.getId());

        // Fetch user role for this organization
        var role = permissionService.getUserRole(userId, workflow.getOrganizationId());

        return WorkflowResponse.builder()
                .id(workflow.getId().toString())
                .name(workflow.getName())
                .description(workflow.getDescription())
                .organizationId(workflow.getOrganizationId().toString())
                .role(role != null ? role.name() : null)
                .active(workflow.isActive())
                .states(states.stream().map(s -> WorkflowResponse.StateResponse.builder()
                        .id(s.getId().toString())
                        .name(s.getName())
                        .type(s.getType().name())
                        .position(s.getPosition())
                        .positionX(s.getPositionX())
                        .positionY(s.getPositionY())
                        .wipLimit(s.getWipLimit())
                        .build()).toList())
                .transitions(transitions.stream().map(t -> WorkflowResponse.TransitionResponse.builder()
                        .id(t.getId().toString())
                        .name(t.getName())
                        .fromStateId(t.getFromStateId().toString())
                        .toStateId(t.getToStateId().toString())
                        .requiresApproval(t.isRequiresApproval())
                        .build()).toList())
                .createdAt(workflow.getCreatedAt() != null ? workflow.getCreatedAt().toString() : null)
                .build();
    }
}

package com.workflow.engine.workflow.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.workflow.dto.*;
import com.workflow.engine.workflow.service.WorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller for managing Workflows, States, and Transitions.
 * <p>
 * Provides endpoints for creating, retrieving, updating, and deleting
 * workflow definitions. All endpoints are secured and require authentication.
 * </p>
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WorkflowController {

    private final WorkflowService workflowService;

    /**
     * Creates a new workflow in the specified organization.
     *
     * @param organizationId ID of the organization
     * @param request        Workflow creation details
     * @param user           Authenticated user
     * @return Created workflow details
     */
    @PostMapping("/organizations/{organizationId}/workflows")
    public ResponseEntity<WorkflowResponse> create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateWorkflowRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.create(organizationId, request, user.getId()));
    }

    /**
     * Lists all workflows for a specific organization.
     *
     * @param organizationId ID of the organization
     * @param user           Authenticated user
     * @return List of workflows
     */
    @GetMapping("/organizations/{organizationId}/workflows")
    public ResponseEntity<List<WorkflowResponse>> listByOrganization(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.listByOrganization(organizationId, user.getId()));
    }

    /**
     * Retrieves a specific workflow by its ID.
     *
     * @param workflowId ID of the workflow
     * @param user       Authenticated user
     * @return Workflow details
     */
    @GetMapping("/workflows/{workflowId}")
    public ResponseEntity<WorkflowResponse> getById(
            @PathVariable UUID workflowId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.getById(workflowId, user.getId()));
    }

    /**
     * Adds a new state to an existing workflow.
     *
     * @param workflowId ID of the workflow
     * @param request    State details
     * @param user       Authenticated user
     * @return Created state details
     */
    @PostMapping("/workflows/{workflowId}/states")
    public ResponseEntity<WorkflowResponse.StateResponse> addState(
            @PathVariable UUID workflowId,
            @Valid @RequestBody AddStateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.addState(workflowId, request, user.getId()));
    }

    /**
     * Adds a new transition between two states in a workflow.
     *
     * @param workflowId ID of the workflow
     * @param request    Transition details
     * @param user       Authenticated user
     * @return Created transition details
     */
    @PostMapping("/workflows/{workflowId}/transitions")
    public ResponseEntity<WorkflowResponse.TransitionResponse> addTransition(
            @PathVariable UUID workflowId,
            @Valid @RequestBody AddTransitionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workflowService.addTransition(workflowId, request, user.getId()));
    }

    /**
     * Validates and activates a workflow.
     * <p>
     * Validation checks for:
     * 1. Exactly one START state
     * 2. At least one END state
     * 3. Graph connectivity
     * </p>
     *
     * @param workflowId ID of the workflow
     * @param user       Authenticated user
     * @return Updated workflow details
     */
    @PostMapping("/workflows/{workflowId}/validate")
    public ResponseEntity<WorkflowResponse> validateAndActivate(
            @PathVariable UUID workflowId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.validateAndActivate(workflowId, user.getId()));
    }

    /**
     * Assigns an active workflow to a project.
     *
     * @param workflowId ID of the workflow
     * @param projectId  ID of the project
     * @param user       Authenticated user
     * @return 200 OK
     */
    @PostMapping("/workflows/{workflowId}/assign/{projectId}")
    public ResponseEntity<Void> assignToProject(
            @PathVariable UUID workflowId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        workflowService.assignToProject(workflowId, projectId, user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Updates an existing workflow's metadata (name, description).
     *
     * @param workflowId ID of the workflow
     * @param request    Update details
     * @param user       Authenticated user
     * @return Updated workflow details
     */
    @PutMapping("/workflows/{workflowId}")
    public ResponseEntity<WorkflowResponse> update(
            @PathVariable UUID workflowId,
            @Valid @RequestBody CreateWorkflowRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.update(workflowId, request, user.getId()));
    }

    /**
     * Deletes a workflow.
     * <p>
     * Workflow cannot be active if it is assigned to projects.
     * </p>
     *
     * @param workflowId ID of the workflow
     * @param user       Authenticated user
     * @return 204 No Content
     */
    @DeleteMapping("/workflows/{workflowId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID workflowId,
            @AuthenticationPrincipal User user) {
        workflowService.delete(workflowId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes a state from a workflow.
     *
     * @param workflowId ID of the workflow
     * @param stateId    ID of the state
     * @param user       Authenticated user
     * @return 204 No Content
     */
    @DeleteMapping("/workflows/{workflowId}/states/{stateId}")
    public ResponseEntity<Void> deleteState(
            @PathVariable UUID workflowId,
            @PathVariable UUID stateId,
            @AuthenticationPrincipal User user) {
        workflowService.deleteState(workflowId, stateId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes a transition from a workflow.
     *
     * @param workflowId   ID of the workflow
     * @param transitionId ID of the transition
     * @param user         Authenticated user
     * @return 204 No Content
     */
    @DeleteMapping("/workflows/{workflowId}/transitions/{transitionId}")
    public ResponseEntity<Void> deleteTransition(
            @PathVariable UUID workflowId,
            @PathVariable UUID transitionId,
            @AuthenticationPrincipal User user) {
        workflowService.deleteTransition(workflowId, transitionId, user.getId());
        return ResponseEntity.noContent().build();
    }

    /**
     * Updates a transition's details.
     *
     * @param workflowId   ID of the workflow
     * @param transitionId ID of the transition
     * @param request      Update details
     * @param user         Authenticated user
     * @return Updated transition details
     */
    @PutMapping("/workflows/{workflowId}/transitions/{transitionId}")
    public ResponseEntity<WorkflowResponse.TransitionResponse> updateTransition(
            @PathVariable UUID workflowId,
            @PathVariable UUID transitionId,
            @Valid @RequestBody AddTransitionRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.updateTransition(workflowId, transitionId, request, user.getId()));
    }

    /**
     * Bulk updates state positions (for UI layout).
     *
     * @param workflowId ID of the workflow
     * @param positions  List of position updates
     * @param user       Authenticated user
     * @return 200 OK
     */
    @PutMapping("/workflows/{workflowId}/states/positions")
    public ResponseEntity<Void> updateStatePositions(
            @PathVariable UUID workflowId,
            @Valid @RequestBody List<UpdateStatePositionRequest> positions,
            @AuthenticationPrincipal User user) {
        workflowService.updateStatePositions(workflowId, positions, user.getId());
        return ResponseEntity.ok().build();
    }

    /**
     * Updates an existing state's details.
     *
     * @param workflowId ID of the workflow
     * @param stateId    ID of the state
     * @param request    Update details
     * @param user       Authenticated user
     * @return Updated state details
     */
    @PutMapping("/workflows/{workflowId}/states/{stateId}")
    public ResponseEntity<WorkflowResponse.StateResponse> updateState(
            @PathVariable UUID workflowId,
            @PathVariable UUID stateId,
            @Valid @RequestBody UpdateStateRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(workflowService.updateState(workflowId, stateId, request, user.getId()));
    }
}

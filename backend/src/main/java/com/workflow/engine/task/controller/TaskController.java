package com.workflow.engine.task.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.task.dto.*;
import com.workflow.engine.task.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final com.workflow.engine.task.service.TaskCommentService taskCommentService;
    private final com.workflow.engine.task.service.TaskHistoryService taskHistoryService;

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> create(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.create(projectId, request, user.getId()));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskResponse>> listByProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.listByProject(projectId, user.getId()));
    }

    @GetMapping("/organizations/{organizationId}/tasks/my")
    public ResponseEntity<org.springframework.data.domain.Page<MyTasksResponse>> getMyTasks(
            @PathVariable UUID organizationId,
            @RequestParam(defaultValue = "10") int limit,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getMyTasks(organizationId, user.getId(), limit));
    }

    @GetMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getById(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getById(taskId, user.getId()));
    }

    /**
     * ⭐ THE transition endpoint — delegates to TaskTransitionService (SOP Rule 1)
     */
    @PostMapping("/tasks/{taskId}/transition/{transitionId}")
    public ResponseEntity<TaskResponse> transition(
            @PathVariable UUID taskId,
            @PathVariable UUID transitionId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.transition(taskId, transitionId, user.getId()));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskResponse> update(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.update(taskId, request, user.getId()));
    }

    @PutMapping("/tasks/{taskId}/block")
    public ResponseEntity<TaskResponse> toggleBlock(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.toggleBlock(taskId, user.getId()));
    }

    @PostMapping("/tasks/{taskId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID taskId,
            @Valid @RequestBody AddCommentRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskCommentService.addComment(taskId, request, user.getId()));
    }

    @GetMapping("/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskCommentService.getComments(taskId, user.getId()));
    }

    @GetMapping("/tasks/{taskId}/history")
    public ResponseEntity<List<TaskHistoryResponse>> getHistory(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskHistoryService.getHistory(taskId, user.getId()));
    }

    @PostMapping("/tasks/bulk")
    public ResponseEntity<java.util.Map<String, Object>> bulkUpdate(
            @Valid @RequestBody com.workflow.engine.task.dto.BulkTaskRequest request,
            @AuthenticationPrincipal User user) {
        int affected = taskService.bulkUpdate(request, user.getId());
        return ResponseEntity.ok(java.util.Map.of("affected", affected, "operation", request.getOperation()));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        taskService.delete(taskId, user.getId());
        return ResponseEntity.noContent().build();
    }

    // -------------------------------------------------------------------------
    // Task Dependencies / Links
    // -------------------------------------------------------------------------

    @PostMapping("/tasks/{taskId}/links")
    public ResponseEntity<TaskLinkResponse> createLink(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateTaskLinkRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createLink(taskId, request, user.getId()));
    }

    @DeleteMapping("/tasks/{taskId}/links/{targetTaskId}")
    public ResponseEntity<Void> deleteLink(
            @PathVariable UUID taskId,
            @PathVariable UUID targetTaskId,
            @AuthenticationPrincipal User user) {
        taskService.deleteLink(taskId, targetTaskId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tasks/{taskId}/links")
    public ResponseEntity<List<TaskLinkResponse>> getLinks(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(taskService.getLinks(taskId, user.getId()));
    }
}

package com.workflow.engine.agile.controller;

import com.workflow.engine.agile.dto.CreateSprintRequest;
import com.workflow.engine.agile.dto.SprintResponse;
import com.workflow.engine.agile.entity.Sprint;
import com.workflow.engine.agile.service.SprintService;
import com.workflow.engine.auth.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects/{projectId}/sprints")
@RequiredArgsConstructor
public class SprintController {

    private final SprintService sprintService;

    @PostMapping
    public ResponseEntity<SprintResponse> createSprint(@PathVariable UUID projectId,
            @RequestBody @Valid CreateSprintRequest request,
            @AuthenticationPrincipal User user) {
        Sprint sprint = sprintService.createSprint(projectId, request.getName(), request.getGoal(),
                request.getStartDate(), request.getEndDate(), user.getId());
        return ResponseEntity.ok(sprintService.toResponse(sprint));
    }

    @GetMapping
    public ResponseEntity<List<SprintResponse>> listSprints(@PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        List<Sprint> sprints = sprintService.getSprintsByProject(projectId, user.getId());
        return ResponseEntity.ok(sprints.stream().map(sprintService::toResponse).toList());
    }

    @GetMapping("/{sprintId}/burndown")
    public ResponseEntity<com.workflow.engine.agile.dto.BurndownResponse> getBurndown(
            @PathVariable UUID projectId,
            @PathVariable UUID sprintId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(sprintService.getBurndown(sprintId, user.getId()));
    }

    @PostMapping("/{sprintId}/start")
    public ResponseEntity<SprintResponse> startSprint(@PathVariable UUID projectId,
            @PathVariable UUID sprintId,
            @RequestBody @Valid com.workflow.engine.agile.dto.StartSprintRequest request,
            @AuthenticationPrincipal User user) {
        Sprint sprint = sprintService.startSprint(sprintId, request.getName(), request.getGoal(),
                request.getStartDate(), request.getEndDate(), user.getId());
        return ResponseEntity.ok(sprintService.toResponse(sprint));
    }

    @PostMapping("/{sprintId}/complete")
    public ResponseEntity<SprintResponse> completeSprint(@PathVariable UUID projectId,
            @PathVariable UUID sprintId,
            @AuthenticationPrincipal User user) {
        Sprint sprint = sprintService.completeSprint(sprintId, user.getId());
        return ResponseEntity.ok(sprintService.toResponse(sprint));
    }

    @PostMapping("/{sprintId}/tasks/{taskId}")
    public ResponseEntity<Void> addTaskToSprint(@PathVariable UUID projectId,
            @PathVariable UUID sprintId,
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        sprintService.addTaskToSprint(sprintId, taskId, user.getId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{sprintId}/tasks/{taskId}")
    public ResponseEntity<Void> removeTaskFromSprint(@PathVariable UUID projectId,
            @PathVariable UUID sprintId,
            @PathVariable UUID taskId,
            @AuthenticationPrincipal User user) {
        sprintService.removeTaskFromSprint(taskId, user.getId());
        return ResponseEntity.ok().build();
    }

}

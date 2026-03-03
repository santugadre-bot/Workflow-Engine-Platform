package com.workflow.engine.project.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.project.dto.*;
import com.workflow.engine.project.service.ProjectService;
import com.workflow.engine.rbac.entity.ProjectPermission;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations/{organizationId}/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final ProjectPermissionService projectPermissionService;

    @PostMapping
    public ResponseEntity<ProjectResponse> create(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.create(organizationId, request, user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> list(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.listByOrganization(organizationId, user.getId()));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getById(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getById(projectId, organizationId, user.getId()));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> update(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal User user) {
        // Use ProjectPermissionService for granular check
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.MANAGE_PROJECT_SETTINGS);
        return ResponseEntity.ok(projectService.update(projectId, organizationId, request, user.getId()));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        projectService.delete(projectId, organizationId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{projectId}/archive")
    public ResponseEntity<ProjectResponse> archive(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.MANAGE_PROJECT_SETTINGS);
        return ResponseEntity.ok(projectService.archive(projectId, organizationId, user.getId()));
    }

    @GetMapping("/{projectId}/export")
    public ResponseEntity<byte[]> exportData(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        // We'll reuse BROWSE or MANAGE_SETTINGS for export permission. Settings is
        // safer.
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.MANAGE_PROJECT_SETTINGS);
        byte[] exportData = projectService.exportProjectData(projectId, organizationId, user.getId());

        return ResponseEntity.ok()
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"project_" + projectId + "_export.json\"")
                .header(org.springframework.http.HttpHeaders.CONTENT_TYPE, "application/json")
                .body(exportData);
    }

    // -------------------------------------------------------------------------
    // Project Member Management
    // -------------------------------------------------------------------------

    @PostMapping("/{projectId}/members")
    public ResponseEntity<ProjectMemberDetailResponse> addMember(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @Valid @RequestBody AddProjectMemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addProjectMember(projectId, organizationId, request, user.getId()));
    }

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<ProjectMemberDetailResponse>> listMembers(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.listProjectMembers(projectId, organizationId, user.getId()));
    }

    @DeleteMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal User user) {
        projectService.removeProjectMember(projectId, organizationId, memberId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{projectId}/members/bulk")
    public ResponseEntity<Void> removeMembersBulk(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @RequestBody List<UUID> memberIds,
            @AuthenticationPrincipal User user) {
        projectService.removeProjectMembersBulk(projectId, organizationId, memberIds, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{projectId}/members/{memberId}")
    public ResponseEntity<ProjectMemberDetailResponse> updateMemberRole(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @PathVariable UUID memberId,
            @RequestParam com.workflow.engine.rbac.entity.ProjectRole role,
            @AuthenticationPrincipal User user) {
        return ResponseEntity
                .ok(projectService.updateProjectMemberRole(projectId, organizationId, memberId, role, user.getId()));
    }
}

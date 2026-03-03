package com.workflow.engine.automation.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.automation.dto.AutomationRuleRequest;
import com.workflow.engine.automation.dto.AutomationRuleResponse;
import com.workflow.engine.automation.service.AutomationService;
import com.workflow.engine.rbac.entity.ProjectPermission;
import com.workflow.engine.rbac.service.ProjectPermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/automation")
@RequiredArgsConstructor
public class AutomationRuleController {

    private final AutomationService automationService;
    private final ProjectPermissionService projectPermissionService;

    @GetMapping
    public ResponseEntity<List<AutomationRuleResponse>> listRules(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal User user) {
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.BROWSE_PROJECT);
        return ResponseEntity.ok(automationService.listAllRulesByProject(projectId));
    }

    @PostMapping
    public ResponseEntity<AutomationRuleResponse> createRule(
            @PathVariable UUID projectId,
            @RequestBody AutomationRuleRequest request,
            @AuthenticationPrincipal User user) {
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.MANAGE_PROJECT_SETTINGS);
        return ResponseEntity.ok(automationService.createRule(projectId, request));
    }

    @PutMapping("/{ruleId}")
    public ResponseEntity<AutomationRuleResponse> updateRule(
            @PathVariable UUID projectId,
            @PathVariable UUID ruleId,
            @RequestBody AutomationRuleRequest request,
            @AuthenticationPrincipal User user) {
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.MANAGE_PROJECT_SETTINGS);
        return ResponseEntity.ok(automationService.updateRule(ruleId, request));
    }

    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable UUID projectId,
            @PathVariable UUID ruleId,
            @AuthenticationPrincipal User user) {
        projectPermissionService.checkPermission(user.getId(), projectId, ProjectPermission.MANAGE_PROJECT_SETTINGS);
        automationService.deleteRule(ruleId);
        return ResponseEntity.noContent().build();
    }
}

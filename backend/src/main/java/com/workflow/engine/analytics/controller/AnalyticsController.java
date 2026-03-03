package com.workflow.engine.analytics.controller;

import com.workflow.engine.analytics.dto.AnalyticsResponse;
import com.workflow.engine.analytics.service.AnalyticsService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/organizations/{organizationId}/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<AnalyticsResponse> getOrganizationAnalytics(
            @PathVariable UUID organizationId,
            @RequestParam(defaultValue = "30") int days,
            @AuthenticationPrincipal User user) {
        permissionService.checkPermission(user.getId(), organizationId,
                OrganizationRole.MEMBER);
        return ResponseEntity.ok(analyticsService.getOrganizationAnalytics(organizationId, days));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<AnalyticsResponse> getProjectAnalytics(
            @PathVariable UUID organizationId,
            @PathVariable UUID projectId,
            @RequestParam(defaultValue = "30") int days,
            @AuthenticationPrincipal User user) {
        permissionService.checkPermission(user.getId(), organizationId, OrganizationRole.MEMBER);
        return ResponseEntity.ok(analyticsService.getProjectAnalytics(projectId, days));
    }
}

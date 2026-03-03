package com.workflow.engine.approval.controller;

import com.workflow.engine.approval.dto.ApprovalResponse;
import com.workflow.engine.approval.service.ApprovalService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations/{organizationId}/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;
    private final PermissionService permissionService;

    @GetMapping
    public ResponseEntity<List<ApprovalResponse>> getPendingApprovals(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        permissionService.checkPermission(user.getId(), organizationId, OrganizationRole.ADMIN);
        return ResponseEntity.ok(approvalService.getPendingRequests(organizationId));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ApprovalResponse>> getApprovalHistory(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        permissionService.checkPermission(user.getId(), organizationId, OrganizationRole.ADMIN);
        return ResponseEntity.ok(approvalService.getHistoryRequests(organizationId));
    }

    @PostMapping("/{requestId}/process")
    public ResponseEntity<Void> processRequest(
            @PathVariable UUID organizationId,
            @PathVariable UUID requestId,
            @RequestParam String status,
            @RequestParam(required = false) String comment,
            @AuthenticationPrincipal User user) {
        permissionService.checkPermission(user.getId(), organizationId, OrganizationRole.ADMIN);
        approvalService.processRequest(requestId, user.getId(), status, comment);
        return ResponseEntity.ok().build();
    }
}

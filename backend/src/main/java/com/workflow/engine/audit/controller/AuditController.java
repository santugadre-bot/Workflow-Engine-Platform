package com.workflow.engine.audit.controller;

import com.workflow.engine.audit.dto.AuditLogResponse;
import com.workflow.engine.audit.service.AuditService;
import com.workflow.engine.auth.entity.User;
import com.workflow.engine.auth.repository.UserRepository;
import com.workflow.engine.rbac.entity.OrganizationRole;
import com.workflow.engine.rbac.service.PermissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/organizations/{organizationId}/activity")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;
    private final PermissionService permissionService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<AuditLogResponse>> getActivity(
            @PathVariable UUID organizationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal User currentUser) {
        permissionService.checkPermission(currentUser.getId(), organizationId, OrganizationRole.MEMBER);

        Page<AuditLogResponse> response = auditService.getOrganizationActivity(organizationId, page, size)
                .map(log -> {
                    User user = userRepository.findById(log.getUserId()).orElse(null);
                    return AuditLogResponse.builder()
                            .id(log.getId().toString())
                            .userId(log.getUserId().toString())
                            .userName(user != null ? user.getDisplayName() : "Unknown")
                            .actionType(log.getActionType())
                            .entityType(log.getEntityType())
                            .entityId(log.getEntityId().toString())
                            .metadata(log.getMetadata())
                            .timestamp(log.getCreatedAt() != null ? log.getCreatedAt().toString() : null)
                            .build();
                });

        return ResponseEntity.ok(response);
    }
}

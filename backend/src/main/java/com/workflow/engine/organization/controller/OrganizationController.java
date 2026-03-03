package com.workflow.engine.organization.controller;

import com.workflow.engine.auth.entity.User;
import com.workflow.engine.organization.dto.*;
import com.workflow.engine.organization.service.OrganizationService;
import com.workflow.engine.rbac.entity.OrganizationRole;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/organizations")
@RequiredArgsConstructor
public class OrganizationController {

    private final OrganizationService organizationService;

    @PostMapping
    public ResponseEntity<OrganizationResponse> create(
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizationService.create(request, user.getId()));
    }

    @GetMapping
    public ResponseEntity<List<OrganizationResponse>> listMyOrganizations(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.listUserOrganizations(user.getId()));
    }

    @GetMapping("/{organizationId}")
    public ResponseEntity<OrganizationResponse> getById(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.getById(organizationId, user.getId()));
    }

    @PostMapping("/{organizationId}/members")
    public ResponseEntity<MemberResponse> addMember(
            @PathVariable UUID organizationId,
            @Valid @RequestBody AddMemberRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(organizationService.addMember(organizationId, request, user.getId()));
    }

    @GetMapping("/{organizationId}/members")
    public ResponseEntity<List<MemberResponse>> listMembers(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.listMembers(organizationId, user.getId()));
    }

    @PutMapping("/{organizationId}")
    public ResponseEntity<OrganizationResponse> update(
            @PathVariable UUID organizationId,
            @Valid @RequestBody CreateOrganizationRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.update(organizationId, request, user.getId()));
    }

    @DeleteMapping("/{organizationId}")
    public ResponseEntity<Void> delete(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        organizationService.delete(organizationId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{organizationId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID organizationId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal User user) {
        organizationService.removeMember(organizationId, memberId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{organizationId}/members/bulk")
    public ResponseEntity<Void> removeMembersBulk(
            @PathVariable UUID organizationId,
            @RequestBody List<UUID> memberIds,
            @AuthenticationPrincipal User user) {
        organizationService.removeMembersBulk(organizationId, memberIds, user.getId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{organizationId}/members/{memberId}")
    public ResponseEntity<MemberResponse> updateMemberRole(
            @PathVariable UUID organizationId,
            @PathVariable UUID memberId,
            @RequestParam OrganizationRole role,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.updateMemberRole(organizationId, memberId, role, user.getId()));
    }

    @GetMapping("/{organizationId}/stats")
    public ResponseEntity<OrganizationStatsResponse> getStats(
            @PathVariable UUID organizationId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.getStats(organizationId, user.getId()));
    }

    @GetMapping("/{organizationId}/dashboard/activity")
    public ResponseEntity<List<OrganizationActivityResponse>> getDashboardActivity(
            @PathVariable UUID organizationId,
            @RequestParam(defaultValue = "20") int limit,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(organizationService.getRecentActivity(organizationId, user.getId(), limit));
    }
}

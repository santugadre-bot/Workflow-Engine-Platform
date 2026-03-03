package com.workflow.engine.approval.repository;

import com.workflow.engine.approval.entity.ApprovalRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ApprovalRequestRepository extends JpaRepository<ApprovalRequest, UUID> {
    List<ApprovalRequest> findByOrganizationIdAndStatus(UUID organizationId, ApprovalRequest.ApprovalStatus status);

    List<ApprovalRequest> findByTaskIdAndStatus(UUID taskId, ApprovalRequest.ApprovalStatus status);

    Optional<ApprovalRequest> findByTaskIdAndTransitionIdAndStatus(UUID taskId, UUID transitionId,
            ApprovalRequest.ApprovalStatus status);

    // For history tab: returns APPROVED + REJECTED sorted newest-first
    List<ApprovalRequest> findByOrganizationIdAndStatusInOrderByProcessedAtDesc(
            UUID organizationId, List<ApprovalRequest.ApprovalStatus> statuses);

    // Count by specific statuses (used for stats bar)
    long countByOrganizationIdAndStatus(UUID organizationId, ApprovalRequest.ApprovalStatus status);
}

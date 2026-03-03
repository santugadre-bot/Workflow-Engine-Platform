package com.workflow.engine.audit.service;

import com.workflow.engine.audit.entity.AuditLog;
import com.workflow.engine.audit.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Logs an activity event. Uses REQUIRES_NEW propagation so that
     * audit logging never fails a business transaction.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID userId, String actionType, String entityType,
            UUID entityId, UUID organizationId, String metadata) {
        AuditLog log = AuditLog.builder()
                .userId(userId)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .organizationId(organizationId)
                .metadata(metadata)
                .build();
        auditLogRepository.save(log);
    }

    public Page<AuditLog> getOrganizationActivity(UUID organizationId, int page, int size) {
        return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(
                organizationId, PageRequest.of(page, size));
    }
}

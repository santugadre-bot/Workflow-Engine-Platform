package com.workflow.engine.sla.repository;

import com.workflow.engine.sla.entity.SlaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, UUID> {
    List<SlaPolicy> findByOrganizationId(UUID organizationId);

    List<SlaPolicy> findByProjectId(UUID projectId);
}

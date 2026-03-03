package com.workflow.engine.project.repository;

import com.workflow.engine.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    /** All queries filtered by organization_id — tenant isolation (SOP Rule 2) */
    List<Project> findByOrganizationId(UUID organizationId);

    Optional<Project> findByIdAndOrganizationId(UUID id, UUID organizationId);

    boolean existsByIdAndOrganizationId(UUID id, UUID organizationId);

    long countByOrganizationId(UUID organizationId);
}

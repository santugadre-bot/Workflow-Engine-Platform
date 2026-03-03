package com.workflow.engine.organization.repository;

import com.workflow.engine.organization.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    @Query("SELECT o FROM Organization o JOIN OrganizationMember om ON o.id = om.organizationId " +
            "WHERE om.userId = :userId")
    List<Organization> findAllByMemberUserId(UUID userId);
}

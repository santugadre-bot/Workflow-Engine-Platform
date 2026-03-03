package com.workflow.engine.rbac.repository;

import com.workflow.engine.rbac.entity.OrganizationMember;
import com.workflow.engine.rbac.entity.OrganizationRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrganizationMemberRepository extends JpaRepository<OrganizationMember, UUID> {
    Optional<OrganizationMember> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    List<OrganizationMember> findByUserId(UUID userId);

    List<OrganizationMember> findByOrganizationId(UUID organizationId);

    boolean existsByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    long countByOrganizationId(UUID organizationId);

    List<OrganizationMember> findByOrganizationIdAndRoleIn(UUID organizationId,
            List<OrganizationRole> roles);

    void deleteByUserIdAndOrganizationId(UUID userId, UUID organizationId);
}

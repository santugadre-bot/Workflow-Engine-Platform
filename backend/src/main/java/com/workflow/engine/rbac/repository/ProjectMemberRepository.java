package com.workflow.engine.rbac.repository;

import com.workflow.engine.rbac.entity.ProjectMember;
import com.workflow.engine.rbac.entity.ProjectRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {
    Optional<ProjectMember> findByUserIdAndProjectId(UUID userId, UUID projectId);

    List<ProjectMember> findByUserId(UUID userId);

    List<ProjectMember> findByProjectId(UUID projectId);

    // Batch lookup: load all project memberships for a user across multiple
    // projects in one query
    List<ProjectMember> findByUserIdAndProjectIdIn(UUID userId, List<UUID> projectIds);

    boolean existsByUserIdAndProjectId(UUID userId, UUID projectId);

    long countByProjectId(UUID projectId);

    void deleteByUserIdAndProjectId(UUID userId, UUID projectId);
}

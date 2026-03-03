package com.workflow.engine.rbac.entity;

import com.workflow.engine.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Links a User to an Organization with a specific Role.
 * This is the core of tenant-scoped permission enforcement.
 *
 * NOTE: @Builder intentionally NOT used here — the manual builder below
 * is required because JPA entities extending BaseEntity need the no-arg
 * constructor path (Lombok @Builder would bypass it).
 */
@Entity
@Table(name = "organization_members", uniqueConstraints = @UniqueConstraint(columnNames = { "user_id",
        "organization_id" }))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationMember extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrganizationRole role;

    // Manual builder — uses no-arg constructor + setters, which is JPA-safe
    public static OrganizationMemberBuilder builder() {
        return new OrganizationMemberBuilder();
    }

    public static class OrganizationMemberBuilder {
        private UUID userId;
        private UUID organizationId;
        private OrganizationRole role;

        public OrganizationMemberBuilder userId(UUID userId) {
            this.userId = userId;
            return this;
        }

        public OrganizationMemberBuilder organizationId(UUID organizationId) {
            this.organizationId = organizationId;
            return this;
        }

        public OrganizationMemberBuilder role(OrganizationRole role) {
            this.role = role;
            return this;
        }

        public OrganizationMember build() {
            OrganizationMember member = new OrganizationMember();
            member.setUserId(userId);
            member.setOrganizationId(organizationId);
            member.setRole(role);
            return member;
        }
    }
}

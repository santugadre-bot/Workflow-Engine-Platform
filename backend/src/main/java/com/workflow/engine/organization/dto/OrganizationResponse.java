package com.workflow.engine.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

public class OrganizationResponse {
    private String id;
    private String name;
    private String description;
    private String ownerId;
    private String role;
    private String createdAt;

    public OrganizationResponse() {
    }

    public OrganizationResponse(String id, String name, String description, String ownerId, String role,
            String createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.ownerId = ownerId;
        this.role = role;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public static OrganizationResponseBuilder builder() {
        return new OrganizationResponseBuilder();
    }

    public static class OrganizationResponseBuilder {
        private String id;
        private String name;
        private String description;
        private String ownerId;
        private String role;
        private String createdAt;

        public OrganizationResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public OrganizationResponseBuilder name(String name) {
            this.name = name;
            return this;
        }

        public OrganizationResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public OrganizationResponseBuilder ownerId(String ownerId) {
            this.ownerId = ownerId;
            return this;
        }

        public OrganizationResponseBuilder role(String role) {
            this.role = role;
            return this;
        }

        public OrganizationResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public OrganizationResponse build() {
            return new OrganizationResponse(id, name, description, ownerId, role, createdAt);
        }
    }
}

package com.workflow.engine.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

public class OrganizationActivityResponse {
    private String id;
    private String actionType;
    private String entityType;
    private String entityId;
    private String metadata;
    private String userId;
    private String userName;
    private String createdAt;

    public OrganizationActivityResponse() {
    }

    public OrganizationActivityResponse(String id, String actionType, String entityType, String entityId,
            String metadata, String userId, String userName, String createdAt) {
        this.id = id;
        this.actionType = actionType;
        this.entityType = entityType;
        this.entityId = entityId;
        this.metadata = metadata;
        this.userId = userId;
        this.userName = userName;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getMetadata() {
        return metadata;
    }

    public void setMetadata(String metadata) {
        this.metadata = metadata;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public static OrganizationActivityResponseBuilder builder() {
        return new OrganizationActivityResponseBuilder();
    }

    public static class OrganizationActivityResponseBuilder {
        private String id;
        private String actionType;
        private String entityType;
        private String entityId;
        private String metadata;
        private String userId;
        private String userName;
        private String createdAt;

        public OrganizationActivityResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public OrganizationActivityResponseBuilder actionType(String actionType) {
            this.actionType = actionType;
            return this;
        }

        public OrganizationActivityResponseBuilder entityType(String entityType) {
            this.entityType = entityType;
            return this;
        }

        public OrganizationActivityResponseBuilder entityId(String entityId) {
            this.entityId = entityId;
            return this;
        }

        public OrganizationActivityResponseBuilder metadata(String metadata) {
            this.metadata = metadata;
            return this;
        }

        public OrganizationActivityResponseBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public OrganizationActivityResponseBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public OrganizationActivityResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public OrganizationActivityResponse build() {
            return new OrganizationActivityResponse(id, actionType, entityType, entityId, metadata, userId, userName,
                    createdAt);
        }
    }
}

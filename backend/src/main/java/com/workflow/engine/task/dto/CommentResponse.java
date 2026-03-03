package com.workflow.engine.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

public class CommentResponse {
    private String id;
    private String content;
    private String userId;
    private String userName;
    private String createdAt;

    public CommentResponse() {
    }

    public CommentResponse(String id, String content, String userId, String userName, String createdAt) {
        this.id = id;
        this.content = content;
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

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
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

    public static CommentResponseBuilder builder() {
        return new CommentResponseBuilder();
    }

    public static class CommentResponseBuilder {
        private String id;
        private String content;
        private String userId;
        private String userName;
        private String createdAt;

        public CommentResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public CommentResponseBuilder content(String content) {
            this.content = content;
            return this;
        }

        public CommentResponseBuilder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public CommentResponseBuilder userName(String userName) {
            this.userName = userName;
            return this;
        }

        public CommentResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public CommentResponse build() {
            return new CommentResponse(id, content, userId, userName, createdAt);
        }
    }
}

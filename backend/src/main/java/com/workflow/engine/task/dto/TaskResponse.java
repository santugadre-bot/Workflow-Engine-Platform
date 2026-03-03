package com.workflow.engine.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

public class TaskResponse {
    private String id;
    private String title;
    private String description;
    private String priority;
    private String dueDate;
    private String assigneeId;
    private String assigneeName;
    private String currentStateId;
    private String currentStateName;
    private String currentStateType; // START, IN_PROGRESS, DONE, or END
    private String projectId;
    private String organizationId;
    private boolean isBlocked;
    private String createdAt;
    private String updatedAt;
    private String sprintId; // Added for Agile
    private Integer position; // Added for Kanban reordering
    private Integer storyPoints; // Added for Agile Planning
    private List<TransitionOption> availableTransitions;
    private String creatorId; // Added for full audit
    private String creatorName;
    private String resolvedAt;

    // Elite UI Fields
    private String coverImage;
    private List<String> tags;
    private int subtaskCount;
    private int completedSubtaskCount;
    private int commentCount;
    private int attachmentCount;
    private List<SubtaskResponse> subtasks;

    public TaskResponse() {
    }

    public TaskResponse(String id, String title, String description, String priority, String dueDate,
            String assigneeId,
            String assigneeName, String currentStateId, String currentStateName, String currentStateType,
            String projectId, String organizationId, boolean isBlocked, String createdAt, String updatedAt,
            String sprintId, Integer position, Integer storyPoints,
            List<TransitionOption> availableTransitions, String coverImage,
            List<String> tags, int subtaskCount, int completedSubtaskCount, int commentCount, int attachmentCount,
            List<SubtaskResponse> subtasks, String creatorId, String creatorName, String resolvedAt) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
        this.assigneeId = assigneeId;
        this.assigneeName = assigneeName;
        this.currentStateId = currentStateId;
        this.currentStateName = currentStateName;
        this.currentStateType = currentStateType;
        this.projectId = projectId;
        this.organizationId = organizationId;
        this.isBlocked = isBlocked;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.sprintId = sprintId;
        this.position = position;
        this.storyPoints = storyPoints;
        this.availableTransitions = availableTransitions;
        this.coverImage = coverImage;
        this.tags = tags;
        this.subtaskCount = subtaskCount;
        this.completedSubtaskCount = completedSubtaskCount;
        this.commentCount = commentCount;
        this.attachmentCount = attachmentCount;
        this.subtasks = subtasks;
        this.creatorId = creatorId;
        this.creatorName = creatorName;
        this.resolvedAt = resolvedAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public String getAssigneeId() {
        return assigneeId;
    }

    public void setAssigneeId(String assigneeId) {
        this.assigneeId = assigneeId;
    }

    public String getAssigneeName() {
        return assigneeName;
    }

    public void setAssigneeName(String assigneeName) {
        this.assigneeName = assigneeName;
    }

    public String getCurrentStateId() {
        return currentStateId;
    }

    public void setCurrentStateId(String currentStateId) {
        this.currentStateId = currentStateId;
    }

    public String getCurrentStateName() {
        return currentStateName;
    }

    public void setCurrentStateName(String currentStateName) {
        this.currentStateName = currentStateName;
    }

    public String getCurrentStateType() {
        return currentStateType;
    }

    public void setCurrentStateType(String currentStateType) {
        this.currentStateType = currentStateType;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public String getOrganizationId() {
        return organizationId;
    }

    public void setOrganizationId(String organizationId) {
        this.organizationId = organizationId;
    }

    public boolean isBlocked() {
        return isBlocked;
    }

    public void setBlocked(boolean blocked) {
        isBlocked = blocked;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getSprintId() {
        return sprintId;
    }

    public void setSprintId(String sprintId) {
        this.sprintId = sprintId;
    }

    public Integer getPosition() {
        return position;
    }

    public void setPosition(Integer position) {
        this.position = position;
    }

    public Integer getStoryPoints() {
        return storyPoints;
    }

    public void setStoryPoints(Integer storyPoints) {
        this.storyPoints = storyPoints;
    }

    public List<TransitionOption> getAvailableTransitions() {
        return availableTransitions;
    }

    public void setAvailableTransitions(List<TransitionOption> availableTransitions) {
        this.availableTransitions = availableTransitions;
    }

    public String getCoverImage() {
        return coverImage;
    }

    public void setCoverImage(String coverImage) {
        this.coverImage = coverImage;
    }

    public List<String> getTags() {
        return tags;
    }

    public void setTags(List<String> tags) {
        this.tags = tags;
    }

    public int getSubtaskCount() {
        return subtaskCount;
    }

    public void setSubtaskCount(int subtaskCount) {
        this.subtaskCount = subtaskCount;
    }

    public int getCompletedSubtaskCount() {
        return completedSubtaskCount;
    }

    public void setCompletedSubtaskCount(int completedSubtaskCount) {
        this.completedSubtaskCount = completedSubtaskCount;
    }

    public int getCommentCount() {
        return commentCount;
    }

    public void setCommentCount(int commentCount) {
        this.commentCount = commentCount;
    }

    public int getAttachmentCount() {
        return attachmentCount;
    }

    public void setAttachmentCount(int attachmentCount) {
        this.attachmentCount = attachmentCount;
    }

    public List<SubtaskResponse> getSubtasks() {
        return subtasks;
    }

    public void setSubtasks(List<SubtaskResponse> subtasks) {
        this.subtasks = subtasks;
    }

    public static TaskResponseBuilder builder() {
        return new TaskResponseBuilder();
    }

    public static class TaskResponseBuilder {
        private String id;
        private String title;
        private String description;
        private String priority;
        private String dueDate;
        private String assigneeId;
        private String assigneeName;
        private String currentStateId;
        private String currentStateName;
        private String currentStateType;
        private String projectId;
        private String organizationId;
        private boolean isBlocked;
        private String createdAt;
        private String updatedAt;
        private String sprintId;
        private Integer position;
        private Integer storyPoints;
        private List<TransitionOption> availableTransitions;
        private String creatorId;
        private String creatorName;
        private String resolvedAt;
        private String coverImage;
        private List<String> tags;
        private int subtaskCount;
        private int completedSubtaskCount;
        private int commentCount;
        private int attachmentCount;
        private List<SubtaskResponse> subtasks;

        public TaskResponseBuilder id(String id) {
            this.id = id;
            return this;
        }

        public TaskResponseBuilder title(String title) {
            this.title = title;
            return this;
        }

        public TaskResponseBuilder description(String description) {
            this.description = description;
            return this;
        }

        public TaskResponseBuilder priority(String priority) {
            this.priority = priority;
            return this;
        }

        public TaskResponseBuilder dueDate(String dueDate) {
            this.dueDate = dueDate;
            return this;
        }

        public TaskResponseBuilder assigneeId(String assigneeId) {
            this.assigneeId = assigneeId;
            return this;
        }

        public TaskResponseBuilder assigneeName(String assigneeName) {
            this.assigneeName = assigneeName;
            return this;
        }

        public TaskResponseBuilder currentStateId(String currentStateId) {
            this.currentStateId = currentStateId;
            return this;
        }

        public TaskResponseBuilder currentStateName(String currentStateName) {
            this.currentStateName = currentStateName;
            return this;
        }

        public TaskResponseBuilder currentStateType(String currentStateType) {
            this.currentStateType = currentStateType;
            return this;
        }

        public TaskResponseBuilder projectId(String projectId) {
            this.projectId = projectId;
            return this;
        }

        public TaskResponseBuilder organizationId(String organizationId) {
            this.organizationId = organizationId;
            return this;
        }

        public TaskResponseBuilder isBlocked(boolean isBlocked) {
            this.isBlocked = isBlocked;
            return this;
        }

        public TaskResponseBuilder createdAt(String createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public TaskResponseBuilder updatedAt(String updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public TaskResponseBuilder sprintId(String sprintId) {
            this.sprintId = sprintId;
            return this;
        }

        public TaskResponseBuilder position(Integer position) {
            this.position = position;
            return this;
        }

        public TaskResponseBuilder storyPoints(Integer storyPoints) {
            this.storyPoints = storyPoints;
            return this;
        }

        public TaskResponseBuilder availableTransitions(List<TransitionOption> availableTransitions) {
            this.availableTransitions = availableTransitions;
            return this;
        }

        public TaskResponseBuilder coverImage(String coverImage) {
            this.coverImage = coverImage;
            return this;
        }

        public TaskResponseBuilder tags(List<String> tags) {
            this.tags = tags;
            return this;
        }

        public TaskResponseBuilder subtaskCount(int subtaskCount) {
            this.subtaskCount = subtaskCount;
            return this;
        }

        public TaskResponseBuilder completedSubtaskCount(int completedSubtaskCount) {
            this.completedSubtaskCount = completedSubtaskCount;
            return this;
        }

        public TaskResponseBuilder commentCount(int commentCount) {
            this.commentCount = commentCount;
            return this;
        }

        public TaskResponseBuilder attachmentCount(int attachmentCount) {
            this.attachmentCount = attachmentCount;
            return this;
        }

        public TaskResponseBuilder subtasks(List<SubtaskResponse> subtasks) {
            this.subtasks = subtasks;
            return this;
        }

        public TaskResponseBuilder creatorId(String creatorId) {
            this.creatorId = creatorId;
            return this;
        }

        public TaskResponseBuilder creatorName(String creatorName) {
            this.creatorName = creatorName;
            return this;
        }

        public TaskResponseBuilder resolvedAt(String resolvedAt) {
            this.resolvedAt = resolvedAt;
            return this;
        }

        public TaskResponse build() {
            return new TaskResponse(id, title, description, priority, dueDate, assigneeId,
                    assigneeName, currentStateId, currentStateName, currentStateType,
                    projectId, organizationId, isBlocked, createdAt, updatedAt, sprintId, position,
                    storyPoints, availableTransitions, coverImage, tags, subtaskCount, completedSubtaskCount,
                    commentCount, attachmentCount, subtasks, creatorId, creatorName, resolvedAt);
        }
    }

    public static class SubtaskResponse {
        private String id;
        private String title;
        private boolean completed;

        public SubtaskResponse() {
        }

        public SubtaskResponse(String id, String title, boolean completed) {
            this.id = id;
            this.title = title;
            this.completed = completed;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public boolean isCompleted() {
            return completed;
        }

        public void setCompleted(boolean completed) {
            this.completed = completed;
        }

        public static SubtaskResponseBuilder builder() {
            return new SubtaskResponseBuilder();
        }

        public static class SubtaskResponseBuilder {
            private String id;
            private String title;
            private boolean completed;

            public SubtaskResponseBuilder id(String id) {
                this.id = id;
                return this;
            }

            public SubtaskResponseBuilder title(String title) {
                this.title = title;
                return this;
            }

            public SubtaskResponseBuilder completed(boolean completed) {
                this.completed = completed;
                return this;
            }

            public SubtaskResponse build() {
                return new SubtaskResponse(id, title, completed);
            }
        }
    }

    public static class TransitionOption {
        private String transitionId;
        private String transitionName;
        private String targetStateId;
        private String targetStateName;
        private boolean requiresApproval;

        public TransitionOption() {
        }

        public TransitionOption(String transitionId, String transitionName, String targetStateId,
                String targetStateName, boolean requiresApproval) {
            this.transitionId = transitionId;
            this.transitionName = transitionName;
            this.targetStateId = targetStateId;
            this.targetStateName = targetStateName;
            this.requiresApproval = requiresApproval;
        }

        public String getTransitionId() {
            return transitionId;
        }

        public void setTransitionId(String transitionId) {
            this.transitionId = transitionId;
        }

        public String getTransitionName() {
            return transitionName;
        }

        public void setTransitionName(String transitionName) {
            this.transitionName = transitionName;
        }

        public String getTargetStateId() {
            return targetStateId;
        }

        public void setTargetStateId(String targetStateId) {
            this.targetStateId = targetStateId;
        }

        public String getTargetStateName() {
            return targetStateName;
        }

        public void setTargetStateName(String targetStateName) {
            this.targetStateName = targetStateName;
        }

        public boolean isRequiresApproval() {
            return requiresApproval;
        }

        public void setRequiresApproval(boolean requiresApproval) {
            this.requiresApproval = requiresApproval;
        }

        public static TransitionOptionBuilder builder() {
            return new TransitionOptionBuilder();
        }

        public static class TransitionOptionBuilder {
            private String transitionId;
            private String transitionName;
            private String targetStateId;
            private String targetStateName;
            private boolean requiresApproval;

            public TransitionOptionBuilder transitionId(String transitionId) {
                this.transitionId = transitionId;
                return this;
            }

            public TransitionOptionBuilder transitionName(String transitionName) {
                this.transitionName = transitionName;
                return this;
            }

            public TransitionOptionBuilder targetStateId(String targetStateId) {
                this.targetStateId = targetStateId;
                return this;
            }

            public TransitionOptionBuilder targetStateName(String targetStateName) {
                this.targetStateName = targetStateName;
                return this;
            }

            public TransitionOptionBuilder requiresApproval(boolean requiresApproval) {
                this.requiresApproval = requiresApproval;
                return this;
            }

            public TransitionOption build() {
                return new TransitionOption(transitionId, transitionName, targetStateId, targetStateName,
                        requiresApproval);
            }
        }
    }
}

package com.workflow.engine.organization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

public class OrganizationStatsResponse {
    private long projectCount;
    private long workflowCount;
    private long taskCount;
    private long openTasksCount;
    private long memberCount;
    private long activeWorkflowsCount;
    // New fields for UX enhancements
    private long overdueTaskCount;
    private long dueSoonTaskCount;

    public OrganizationStatsResponse() {
    }

    public OrganizationStatsResponse(long projectCount, long workflowCount, long taskCount, long openTasksCount,
            long memberCount, long activeWorkflowsCount, long overdueTaskCount, long dueSoonTaskCount) {
        this.projectCount = projectCount;
        this.workflowCount = workflowCount;
        this.taskCount = taskCount;
        this.openTasksCount = openTasksCount;
        this.memberCount = memberCount;
        this.activeWorkflowsCount = activeWorkflowsCount;
        this.overdueTaskCount = overdueTaskCount;
        this.dueSoonTaskCount = dueSoonTaskCount;
    }

    public long getProjectCount() {
        return projectCount;
    }

    public void setProjectCount(long projectCount) {
        this.projectCount = projectCount;
    }

    public long getWorkflowCount() {
        return workflowCount;
    }

    public void setWorkflowCount(long workflowCount) {
        this.workflowCount = workflowCount;
    }

    public long getTaskCount() {
        return taskCount;
    }

    public void setTaskCount(long taskCount) {
        this.taskCount = taskCount;
    }

    public long getOpenTasksCount() {
        return openTasksCount;
    }

    public void setOpenTasksCount(long openTasksCount) {
        this.openTasksCount = openTasksCount;
    }

    public long getMemberCount() {
        return memberCount;
    }

    public void setMemberCount(long memberCount) {
        this.memberCount = memberCount;
    }

    public long getActiveWorkflowsCount() {
        return activeWorkflowsCount;
    }

    public void setActiveWorkflowsCount(long activeWorkflowsCount) {
        this.activeWorkflowsCount = activeWorkflowsCount;
    }

    public long getOverdueTaskCount() {
        return overdueTaskCount;
    }

    public void setOverdueTaskCount(long overdueTaskCount) {
        this.overdueTaskCount = overdueTaskCount;
    }

    public long getDueSoonTaskCount() {
        return dueSoonTaskCount;
    }

    public void setDueSoonTaskCount(long dueSoonTaskCount) {
        this.dueSoonTaskCount = dueSoonTaskCount;
    }

    public static OrganizationStatsResponseBuilder builder() {
        return new OrganizationStatsResponseBuilder();
    }

    public static class OrganizationStatsResponseBuilder {
        private long projectCount;
        private long workflowCount;
        private long taskCount;
        private long openTasksCount;
        private long memberCount;
        private long activeWorkflowsCount;
        private long overdueTaskCount;
        private long dueSoonTaskCount;

        public OrganizationStatsResponseBuilder projectCount(long projectCount) {
            this.projectCount = projectCount;
            return this;
        }

        public OrganizationStatsResponseBuilder workflowCount(long workflowCount) {
            this.workflowCount = workflowCount;
            return this;
        }

        public OrganizationStatsResponseBuilder taskCount(long taskCount) {
            this.taskCount = taskCount;
            return this;
        }

        public OrganizationStatsResponseBuilder openTasksCount(long openTasksCount) {
            this.openTasksCount = openTasksCount;
            return this;
        }

        public OrganizationStatsResponseBuilder memberCount(long memberCount) {
            this.memberCount = memberCount;
            return this;
        }

        public OrganizationStatsResponseBuilder activeWorkflowsCount(long activeWorkflowsCount) {
            this.activeWorkflowsCount = activeWorkflowsCount;
            return this;
        }

        public OrganizationStatsResponseBuilder overdueTaskCount(long overdueTaskCount) {
            this.overdueTaskCount = overdueTaskCount;
            return this;
        }

        public OrganizationStatsResponseBuilder dueSoonTaskCount(long dueSoonTaskCount) {
            this.dueSoonTaskCount = dueSoonTaskCount;
            return this;
        }

        public OrganizationStatsResponse build() {
            return new OrganizationStatsResponse(projectCount, workflowCount, taskCount, openTasksCount, memberCount,
                    activeWorkflowsCount, overdueTaskCount, dueSoonTaskCount);
        }
    }
}

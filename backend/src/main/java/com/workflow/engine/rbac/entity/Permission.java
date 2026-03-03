package com.workflow.engine.rbac.entity;

public enum Permission {
    // Project Permissions
    CREATE_PROJECT,
    DELETE_PROJECT,
    EDIT_PROJECT,
    VIEW_PROJECT,

    // Issue/Task Permissions
    CREATE_ISSUE,
    EDIT_ISSUE,
    DELETE_ISSUE,
    VIEW_ISSUE,
    ASSIGN_ISSUE,
    COMMENT_ISSUE,

    // Sprint/Board Permissions
    MANAGE_SPRINTS,
    MANAGE_BOARD,

    // Member Management
    INVITE_MEMBER,
    REMOVE_MEMBER,
    MANAGE_ROLES,

    // Platform/Organization Permissions
    MANAGE_ORGANIZATION,
    VIEW_METRICS,
    MANAGE_BILLING
}

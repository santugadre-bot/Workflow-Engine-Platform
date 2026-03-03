package com.workflow.engine.rbac.entity;

/**
 * Granular permissions for Project-level RBAC.
 */
public enum ProjectPermission {
    // 3️⃣ PROJECT CONFIGURATION
    MANAGE_PROJECT_SETTINGS,
    CONFIGURE_BOARD,
    MANAGE_WORKFLOW,
    MANAGE_COMPONENTS,
    MANAGE_VERSIONS,
    BULK_EDIT_ISSUES,
    DELETE_ISSUE, // Technically an Issue permission but restricted to Admin usually

    // 4️⃣ AGILE / SPRINT
    CREATE_SPRINT,
    START_SPRINT,
    CLOSE_SPRINT,
    MOVE_ISSUE_TO_SPRINT,
    REORDER_BACKLOG,
    VIEW_VELOCITY_REPORT,

    // 5️⃣ ISSUE-LEVEL
    BROWSE_PROJECT,
    CREATE_ISSUE,
    EDIT_ISSUE,
    ASSIGN_ISSUE,
    TRANSITION_ISSUE,
    COMMENT_ISSUE,
    ATTACH_FILE,
    LINK_ISSUE,
    LOG_WORK,
    ESTIMATE_STORY_POINTS,
    CLONE_ISSUE
}

/**
 * projectPermissions.js
 *
 * Project-level permission helpers.
 * These functions operate on the user's role within a Project
 * (PROJECT_ADMIN | SCRUM_MASTER | TEAM_LEAD | DEVELOPER | QA | REPORTER | VIEWER)
 * — returned by the backend as `project.role`.
 *
 * Import from here when gating project-level UI (issue creation, board config,
 * sprint management, etc.).
 */

/**
 * Numeric role hierarchy — higher = more permissions.
 * Used by hasPermission() for threshold-based checks.
 */
const ROLE_LEVELS = {
    PROJECT_ADMIN: 100,
    SCRUM_MASTER: 90,
    TEAM_LEAD: 80,
    DEVELOPER: 70,
    QA: 60,
    VIEWER: 50,
    REPORTER: 40,
};

/**
 * Returns true if `userRole` meets or exceeds `requiredRole` in the hierarchy.
 * Useful for threshold-based checks (e.g. "at least DEVELOPER").
 */
export function hasPermission(userRole, requiredRole) {
    if (!userRole) return false;
    return (ROLE_LEVELS[userRole] || 0) >= (ROLE_LEVELS[requiredRole] || 0);
}

// ─── Configuration ────────────────────────────────────────────────────────────

/** Can manage project settings (name, description, workflow assignment). */
export function canManageSettings(role) {
    return role === 'PROJECT_ADMIN' || role === 'SCRUM_MASTER';
}

/** Can configure the Kanban board columns and layout. */
export function canConfigureBoard(role) {
    return role === 'PROJECT_ADMIN' || role === 'SCRUM_MASTER';
}

/** Can manage the workflow definition (add/remove/reorder states). */
export function canManageWorkflow(role) {
    return role === 'PROJECT_ADMIN' || role === 'SCRUM_MASTER';
}

/** Alias for canManageWorkflow — kept for semantic clarity in some contexts. */
export function canConfigureWorkflow(role) {
    return role === 'PROJECT_ADMIN' || role === 'SCRUM_MASTER';
}

// ─── Sprint ───────────────────────────────────────────────────────────────────

/** Can create, start, and complete sprints. */
export function canManageSprint(role) {
    return role === 'PROJECT_ADMIN' || role === 'SCRUM_MASTER';
}

// ─── Issues / Tasks ───────────────────────────────────────────────────────────

/** Can create new issues. VIEWER and REPORTER cannot. */
export function canCreateIssue(role) {
    return role && role !== 'VIEWER' && role !== 'REPORTER';
}

/** Can edit issue metadata (title, description, priority, due date). */
export function canEditIssue(role) {
    const authorizedRoles = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER'];
    return role && authorizedRoles.includes(role);
}

/** Can delete issues. */
export function canDeleteIssue(role) {
    return role === 'PROJECT_ADMIN' || role === 'SCRUM_MASTER';
}

/** Can assign issues to team members. */
export function canAssignIssue(role) {
    const authorizedRoles = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD'];
    return role && authorizedRoles.includes(role);
}

/** Can move tasks between workflow states. */
export function canTransitionTask(role) {
    return role !== 'VIEWER' && role !== 'REPORTER';
}

/** Can add comments. Everyone with any role can comment. */
export function canAddComment(role) {
    return !!role;
}

/** Returns true if the user is a project-level admin. */
export function isProjectAdmin(role) {
    return role === 'PROJECT_ADMIN';
}

// ─── Legacy aliases ───────────────────────────────────────────────────────────
// Kept for backward compatibility with older imports.
export const canCreateTask = canCreateIssue;
export const canEditTask = canEditIssue;

// ─── Extended permissions ─────────────────────────────────────────────────────

/** Can attach files — QA, DEVELOPER and above. */
export function canAttachFile(role) {
    const allowed = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER', 'QA'];
    return role && allowed.includes(role);
}

/** Can link related issues — DEVELOPER and above only. */
export function canLinkIssue(role) {
    const allowed = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER'];
    return role && allowed.includes(role);
}

/** Can log work hours on a task — DEVELOPER and above only. */
export function canLogWork(role) {
    const allowed = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER'];
    return role && allowed.includes(role);
}

/**
 * Can self-assign a task (assign to themselves).
 * DEVELOPER, QA — can set assigneeId = own userId only.
 * TEAM_LEAD+ can use full canAssignIssue.
 */
export function canSelfAssign(role) {
    const allowed = ['PROJECT_ADMIN', 'SCRUM_MASTER', 'TEAM_LEAD', 'DEVELOPER', 'QA'];
    return role && allowed.includes(role);
}

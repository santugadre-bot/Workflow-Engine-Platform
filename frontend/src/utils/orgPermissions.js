/**
 * orgPermissions.js
 *
 * Organization-level permission helpers.
 * These functions operate on the user's role within an Organization
 * (OWNER | ADMIN | MEMBER) — returned by the backend as `organization.role`.
 *
 * Import from here when gating org-level UI (create project, create workflow,
 * manage org settings, etc.).
 */

/** Returns true if the user can create a new project in this org. */
export function canCreateProject(role) {
    return role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** Returns true if the user can create / manage workflows in this org. */
export function canCreateWorkflow(role) {
    return role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** Returns true if the user can configure workflows (add states/transitions). */
export function canManageOrgWorkflow(role) {
    return role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** Returns true if the user is an org-level admin or owner. */
export function isOrgAdmin(role) {
    return role === 'OWNER' || role === 'ADMIN' || role === 'SUPER_ADMIN';
}

/** Returns true if the user is the org owner. */
export function isOrgOwner(role) {
    return role === 'OWNER' || role === 'SUPER_ADMIN';
}

/**
 * Returns true if the user can create a brand-new organization.
 * Only SUPER_ADMIN can create organizations — org owners cannot.
 * @param {string} systemRole — user.systemRole from AuthContext
 */
export function canCreateOrganization(systemRole) {
    return systemRole === 'SUPER_ADMIN';
}

/**
 * Returns true if the user is a platform-level super admin.
 * @param {string} systemRole — user.systemRole from AuthContext
 */
export function isSuperAdmin(systemRole) {
    return systemRole === 'SUPER_ADMIN';
}

/**
 * Returns true if the user has any elevated system role
 * (SUPER_ADMIN or PLATFORM_SUPPORT).
 * @param {string} systemRole — user.systemRole from AuthContext
 */
export function isSystemStaff(systemRole) {
    return systemRole === 'SUPER_ADMIN' || systemRole === 'PLATFORM_SUPPORT';
}


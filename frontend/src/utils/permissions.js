/**
 * permissions.js — Re-export barrel
 *
 * This file re-exports everything from the split permission modules so that
 * all existing imports continue to work without modification.
 *
 * For new code, import directly from the appropriate module:
 *   - Org-level gates  → import { canCreateProject } from './orgPermissions'
 *   - Project-level gates → import { canEditIssue } from './projectPermissions'
 */

export * from './orgPermissions';
export * from './projectPermissions';

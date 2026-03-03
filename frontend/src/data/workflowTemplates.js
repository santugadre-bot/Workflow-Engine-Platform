/**
 * WorkflowTemplates.js
 * Pre-built workflow templates that can be applied to a new project workflow.
 * Each template defines states + transitions applied via sequential API calls.
 */

export const WORKFLOW_TEMPLATES = [
    {
        id: 'scrum',
        name: 'Scrum',
        icon: '🏃',
        description: 'Classic agile sprint workflow with review stage',
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        states: [
            { name: 'Backlog', type: 'START', position: 0 },
            { name: 'To Do', type: 'IN_PROGRESS', position: 1 },
            { name: 'In Progress', type: 'IN_PROGRESS', position: 2 },
            { name: 'In Review', type: 'IN_PROGRESS', position: 3 },
            { name: 'Done', type: 'DONE', position: 4 },
            { name: 'Closed', type: 'END', position: 5 },
        ],
        transitions: [
            { from: 0, to: 1, name: 'Start Sprint' },
            { from: 1, to: 2, name: 'Begin Work' },
            { from: 2, to: 3, name: 'Submit for Review', requiresApproval: false },
            { from: 3, to: 2, name: 'Request Changes' },
            { from: 3, to: 4, name: 'Approve', requiresApproval: true },
            { from: 4, to: 5, name: 'Close' },
        ]
    },
    {
        id: 'kanban',
        name: 'Kanban',
        icon: '📋',
        description: 'Simple continuous flow kanban board',
        color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        states: [
            { name: 'Open', type: 'START', position: 0 },
            { name: 'In Progress', type: 'IN_PROGRESS', position: 1, wipLimit: 5 },
            { name: 'Review', type: 'IN_PROGRESS', position: 2, wipLimit: 3 },
            { name: 'Done', type: 'DONE', position: 3 },
            { name: 'Archived', type: 'END', position: 4 },
        ],
        transitions: [
            { from: 0, to: 1, name: 'Start Work' },
            { from: 1, to: 2, name: 'Send for Review' },
            { from: 2, to: 1, name: 'Rework' },
            { from: 2, to: 3, name: 'Approve' },
            { from: 3, to: 4, name: 'Archive' },
        ]
    },
    {
        id: 'bug_triage',
        name: 'Bug Triage',
        icon: '🐛',
        description: 'Bug lifecycle from report to resolved',
        color: 'bg-red-500/10 text-red-600 border-red-500/20',
        states: [
            { name: 'New', type: 'START', position: 0 },
            { name: 'Triage', type: 'IN_PROGRESS', position: 1 },
            { name: 'In Progress', type: 'IN_PROGRESS', position: 2 },
            { name: 'Testing', type: 'IN_PROGRESS', position: 3 },
            { name: 'Resolved', type: 'DONE', position: 4 },
            { name: 'Closed', type: 'END', position: 5 },
            { name: 'Won\'t Fix', type: 'END', position: 6 },
        ],
        transitions: [
            { from: 0, to: 1, name: 'Triage' },
            { from: 1, to: 2, name: 'Assign' },
            { from: 1, to: 6, name: 'Won\'t Fix' },
            { from: 2, to: 3, name: 'Ready to Test' },
            { from: 3, to: 2, name: 'Reopen' },
            { from: 3, to: 4, name: 'Verify Fix' },
            { from: 4, to: 5, name: 'Close' },
        ]
    },
    {
        id: 'content',
        name: 'Content Pipeline',
        icon: '✍️',
        description: 'Content creation from draft to published',
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
        states: [
            { name: 'Draft', type: 'START', position: 0 },
            { name: 'Writing', type: 'IN_PROGRESS', position: 1 },
            { name: 'Review', type: 'IN_PROGRESS', position: 2 },
            { name: 'Approval', type: 'IN_PROGRESS', position: 3 },
            { name: 'Published', type: 'DONE', position: 4 },
            { name: 'Archived', type: 'END', position: 5 },
        ],
        transitions: [
            { from: 0, to: 1, name: 'Start Writing' },
            { from: 1, to: 2, name: 'Submit for Review' },
            { from: 2, to: 1, name: 'Request Edits' },
            { from: 2, to: 3, name: 'Send for Approval', requiresApproval: true },
            { from: 3, to: 1, name: 'Revise' },
            { from: 3, to: 4, name: 'Publish', requiresApproval: true },
            { from: 4, to: 5, name: 'Archive' },
        ]
    },
    {
        id: 'blank',
        name: 'Blank',
        icon: '⬜',
        description: 'Start from scratch with a minimal workflow',
        color: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
        states: [
            { name: 'Start', type: 'START', position: 0 },
            { name: 'Done', type: 'END', position: 1 },
        ],
        transitions: [
            { from: 0, to: 1, name: 'Complete' },
        ]
    },
];


import { useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import {
    HiOutlineFolder, HiChevronRight, HiChevronDown,
    HiOutlineClipboardList, HiOutlineDocumentText
} from 'react-icons/hi';
import { useProjects } from '../../api/projects';
import { useTasks } from '../../api/tasks';

export default function SidebarProjectTree({ organizationId, isCollapsed, isHovered }) {
    const { data: projects } = useProjects(organizationId);

    // Derived state for expanded nodes could be managed here or in store
    // For simplicity, local state.
    const [expandedProjects, setExpandedProjects] = useState({});

    const toggleProject = (e, projectId) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    if (!projects) return null;

    return (
        <div className="space-y-0.5">
            {projects.map(project => (
                <ProjectNode
                    key={project.id}
                    project={project}
                    organizationId={organizationId}
                    isExpanded={!!expandedProjects[project.id]}
                    onToggle={(e) => toggleProject(e, project.id)}
                    isCollapsed={isCollapsed}
                    isHovered={isHovered}
                />
            ))}
        </div>
    );
}

function ProjectNode({ project, organizationId, isExpanded, onToggle, isCollapsed, isHovered }) {
    const { projectId: activeProjectId, taskId: activeTaskId } = useParams();
    const isActive = activeProjectId === project.id;

    // Only fetch tasks if expanded
    const { data: tasks } = useTasks(isExpanded ? project.id : null);

    const [expandedTasks, setExpandedTasks] = useState({});

    const toggleTask = (e, taskId) => {
        e.preventDefault();
        e.stopPropagation();
        setExpandedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
    };

    const showLabel = !isCollapsed || isHovered;

    return (
        <div className="select-none">
            {/* Project Item */}
            <div
                className={`
                    group flex items - center gap - 2 px - 2 py - 1.5 rounded - lg transition - colors cursor - pointer
                    ${isActive ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}
`}
            >
                {/* Expand Toggle */}
                {showLabel && (
                    <button
                        onClick={onToggle}
                        className="p-0.5 rounded-md hover:bg-slate-200/50 text-slate-400 transition-colors"
                    >
                        {isExpanded ? <HiChevronDown className="w-3 h-3" /> : <HiChevronRight className="w-3 h-3" />}
                    </button>
                )}

                {/* Link */}
                <NavLink
                    to={`/projects/${organizationId}/${project.id}`}
                    className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden"
                >
                    <HiOutlineFolder className={`flex-shrink-0 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
                    {showLabel && <span className="truncate text-sm font-medium">{project.name}</span>}
                </NavLink >
            </div >

            {/* Tasks List */}
            {
                isExpanded && showLabel && tasks && (
                    <div className="ml-4 pl-2 border-l border-slate-100 mt-1 space-y-0.5">
                        {tasks.map(task => (
                            <TaskNode
                                key={task.id}
                                task={task}
                                organizationId={organizationId}
                                projectId={project.id}
                                isExpanded={!!expandedTasks[task.id]}
                                onToggle={(e) => toggleTask(e, task.id)}
                                isActive={activeTaskId === task.id}
                            />
                        ))}
                        {tasks.length === 0 && (
                            <div className="px-2 py-1 text-xs text-slate-400 italic">No tasks</div>
                        )}
                    </div>
                )
            }
        </div >
    );
}

function TaskNode({ task, organizationId, projectId, isExpanded, onToggle, isActive }) {
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;

    return (
        <div>
            <div
                className={`
                    group flex items-center gap-2 px-2 py-1 rounded-md transition-colors
                    ${isActive ? 'bg-primary/5 text-primary' : 'text-slate-600 hover:bg-slate-50'}
                `}
            >
                {/* Expand Toggle for Subtasks */}
                <button
                    onClick={onToggle}
                    className={`
                        p-0.5 rounded hover:bg-slate-200/50 text-slate-400 transition-colors
                        ${hasSubtasks ? '' : 'invisible'}
                    `}
                >
                    {isExpanded ? <HiChevronDown className="w-2.5 h-2.5" /> : <HiChevronRight className="w-2.5 h-2.5" />}
                </button>

                <NavLink
                    to={`/projects/${organizationId}/${projectId}/tasks/${task.id}`}
                    className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden"
                >
                    <HiOutlineClipboardList className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate text-xs">{task.title}</span>
                </NavLink>
            </div>

            {/* Subtasks List */}
            {isExpanded && hasSubtasks && (
                <div className="ml-3 pl-2 border-l border-slate-100 mt-0.5 space-y-0.5">
                    {task.subtasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2 px-2 py-1 text-xs text-slate-500 hover:text-slate-700">
                            <div className={`w-1.5 h-1.5 rounded-full border ${subtask.completed ? 'bg-emerald-400 border-emerald-400' : 'border-slate-300'}`} />
                            <span className={`truncate ${subtask.completed ? 'line-through opacity-70' : ''}`}>
                                {subtask.title}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

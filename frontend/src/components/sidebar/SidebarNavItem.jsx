import { NavLink } from 'react-router-dom';

/**
 * SidebarNavItem — a single navigation link.
 * Uses CSS custom properties for colors so it adapts to both light and dark themes.
 */
export default function SidebarNavItem({
    to,
    icon: Icon,
    label,
    end = false,
    badge,
    badgeColor = 'bg-red-500',
    isCollapsed,
}) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => `
                relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 group text-sm
                ${isCollapsed ? 'justify-center px-0 w-10 mx-auto' : ''}
                ${isActive
                    ? 'bg-sidebar-active-bg text-sidebar-active-text font-medium shadow-[inset_0_0_0_1px_var(--sidebar-active-border)]'
                    : 'text-sidebar-text'
                }
            `}
            title={isCollapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    {/* Left accent bar for active state */}
                    {isActive && !isCollapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-active-bar shadow-[0_0_8px_var(--sidebar-active-bar)]" />
                    )}

                    {/* Icon */}
                    <div className="relative flex-shrink-0">
                        <Icon className={`w-[18px] h-[18px] transition-all duration-150 ${isActive ? 'text-sidebar-active-text' : 'text-sidebar-text-muted'}`} />
                        {isCollapsed && badge > 0 && (
                            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 ${badgeColor} rounded-full border-2 border-sidebar-bg`} />
                        )}
                    </div>

                    {/* Label + badge (expanded only) */}
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 truncate">{label}</span>
                            {badge > 0 && (
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${badgeColor}`}>
                                    {badge > 99 ? '99+' : badge}
                                </span>
                            )}
                        </>
                    )}
                </>
            )}
        </NavLink>
    );
}

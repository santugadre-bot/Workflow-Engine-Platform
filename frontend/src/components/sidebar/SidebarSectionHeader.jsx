import { HiChevronDown } from 'react-icons/hi';

/**
 * SidebarSectionHeader — collapsible section label with toggle chevron.
 * Uses CSS vars so it looks correct in both light and dark themes.
 */
export default function SidebarSectionHeader({ label, isOpen, onToggle, icon: Icon }) {
    return (
        <button
            onClick={onToggle}
            className="w-full flex items-center justify-between px-3 py-1.5 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-wider transition-colors group text-sidebar-section-text"
        >
            <div className="flex items-center gap-2">
                {Icon && <Icon className="w-3.5 h-3.5 transition-colors group-hover:text-indigo-500 text-sidebar-text-muted" />}
                <span>{label}</span>
            </div>
            <HiChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} />
        </button>
    );
}

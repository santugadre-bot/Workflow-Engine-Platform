import { HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';

/**
 * SidebarFooter — collapse toggle button. Theme-adaptive via CSS vars.
 */
export default function SidebarFooter({ isCollapsed }) {
    const toggleSidebar = useUIStore((s) => s.toggleSidebar);

    return (
        <div className="p-3 border-t border-sidebar-border">
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-lg transition-all duration-150 hidden md:block bg-sidebar-hover-bg text-sidebar-text"
                    title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                    {isCollapsed
                        ? <HiChevronRight className="w-5 h-5" />
                        : <HiChevronLeft className="w-5 h-5" />
                    }
                </button>
            </div>
        </div>
    );
}

import { HiOutlineSun, HiOutlineMoon, HiOutlineDesktopComputer } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';

export default function ThemeToggle() {
    const theme = useUIStore(s => s.theme);
    const toggleTheme = useUIStore(s => s.toggleTheme);

    return (
        <div className="relative group/theme flex items-center h-full mr-2">
            <button
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-text-muted hover:bg-sidebar-hover-bg hover:text-sidebar-text transition-colors"
                title="Theme settings"
            >
                {theme === 'dark' ? <HiOutlineMoon className="w-4 h-4" /> : theme === 'light' ? <HiOutlineSun className="w-4 h-4" /> : <HiOutlineDesktopComputer className="w-4 h-4" />}
            </button>
            <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-bg-raised border border-sidebar-border rounded-lg shadow-xl opacity-0 invisible group-hover/theme:opacity-100 group-hover/theme:visible transition-all z-50">
                <button
                    onClick={() => toggleTheme('light')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-sidebar-hover-bg ${theme === 'light' ? 'text-primary' : 'text-text-primary'}`}
                >
                    <HiOutlineSun className="w-4 h-4" /> Light
                </button>
                <button
                    onClick={() => toggleTheme('dark')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-sidebar-hover-bg ${theme === 'dark' ? 'text-primary' : 'text-text-primary'}`}
                >
                    <HiOutlineMoon className="w-4 h-4" /> Dark
                </button>
                <button
                    onClick={() => toggleTheme('system')}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-sidebar-hover-bg ${theme === 'system' ? 'text-primary' : 'text-text-primary'}`}
                >
                    <HiOutlineDesktopComputer className="w-4 h-4" /> System
                </button>
            </div>
        </div>
    );
}

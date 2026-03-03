import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import useUIStore from '../../store/uiStore';
import { organizationsApi } from '../../api';
import { useWebSocket } from '../../hooks/useWebSocket';
import CommandPalette from '../topbar/CommandPalette';

/**
 * AppLayout — root authenticated layout shell.
 *
 * Renders: Sidebar + Topbar + main content area + CommandPalette portal.
 * Topbar is prop-free — all context is derived internally.
 */
export default function AppLayout({ children, fullWidth = false }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const sidebarOpen = useUIStore((s) => s.sidebarOpen);
    const addToast = useUIStore((s) => s.addToast);

    // Global WebSocket notification listener
    useWebSocket(user ? `/topic/user.${user.userId}` : null, (message) => {
        if (message.type === 'NOTIFICATION') {
            addToast(`${message.payload?.title || 'New notification'}`, 'info');
        }
    });

    return (
        <div
            className="flex min-h-screen font-sans selection:bg-indigo-500/20"
            style={{ background: 'var(--canvas-bg)', color: 'var(--text-primary)' }}
        >
            <Sidebar />

            <div className={`
                flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out
                ${sidebarOpen ? 'ml-64' : 'ml-16'}
            `}>
                <Topbar />

                <main
                    className={`flex-1 overflow-y-auto ${fullWidth ? 'p-0' : 'p-6'}`}
                    style={{
                        background: 'var(--canvas-bg)',
                        backgroundImage: 'radial-gradient(circle at 1px 1px, var(--canvas-dot) 1px, transparent 0)',
                        backgroundSize: '28px 28px',
                    }}
                >
                    <div className={`${fullWidth ? 'h-full' : 'max-w-7xl mx-auto space-y-6'}`}>
                        {children}
                    </div>
                </main>
            </div>

            {/* Command Palette — rendered at root so it overlays everything */}
            <CommandPalette />
        </div>
    );
}

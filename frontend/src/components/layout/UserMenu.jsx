import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineUser, HiOutlineCog, HiOutlineLogout, HiOutlineSelector, HiOutlineShieldCheck } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import useUIStore from '../../store/uiStore';

const ROLE_BADGE = {
    SUPER_ADMIN: { label: 'Super Admin', className: 'bg-rose-50 text-rose-600 border border-rose-200' },
    ADMIN: { label: 'Admin', className: 'bg-amber-50 text-amber-600 border border-amber-200' },
};

const AVATAR_COLORS = [
    'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500',
    'bg-rose-500', 'bg-orange-500', 'bg-emerald-500', 'bg-cyan-500',
];

function getAvatarColor(name) {
    if (!name) return AVATAR_COLORS[0];
    return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

/**
 * UserMenu — identity + exit.
 *
 * Enterprise rule: user menu = identity + exit. Not a configuration center.
 *
 * Shows:
 * - Avatar + display name + email
 * - Role badge (SUPER_ADMIN / ADMIN) if applicable
 * - My Profile
 * - Organization Settings (if org active)
 * - Sign Out
 */
export default function UserMenu() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const activeOrganizationId = useUIStore((s) => s.activeOrganizationId);

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    const roleBadge = user?.systemRole ? ROLE_BADGE[user.systemRole] : null;
    const initials = user?.displayName?.substring(0, 2).toUpperCase() || 'U';

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 p-1 pl-2 rounded-full border transition-all duration-200
                    ${isOpen
                        ? 'bg-slate-50 border-primary/20 ring-2 ring-primary/10'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
            >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 ${getAvatarColor(user?.displayName)}`}>
                    {initials}
                </div>
                <div className="hidden md:block text-left mr-1">
                    <p className="text-xs font-semibold text-slate-700 max-w-[100px] truncate leading-none">
                        {user?.displayName || 'User'}
                    </p>
                </div>
                <HiOutlineSelector className="w-4 h-4 text-slate-400 mr-0.5" />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-[1100]">

                    {/* Identity header */}
                    <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-800 truncate">{user?.displayName}</p>
                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                            </div>
                            {roleBadge && (
                                <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${roleBadge.className}`}>
                                    <HiOutlineShieldCheck className="w-3 h-3" />
                                    {roleBadge.label}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-1.5 space-y-0.5">
                        <button
                            onClick={() => handleNavigate('/profile')}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors text-left"
                        >
                            <HiOutlineUser className="w-4 h-4" />
                            My Profile
                        </button>

                        {activeOrganizationId && (
                            <button
                                onClick={() => handleNavigate(`/organizations/${activeOrganizationId}/settings`)}
                                className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary rounded-lg transition-colors text-left"
                            >
                                <HiOutlineCog className="w-4 h-4" />
                                Organization Settings
                            </button>
                        )}
                    </div>

                    <div className="h-px bg-slate-100 mx-2" />

                    <div className="p-1.5">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
                        >
                            <HiOutlineLogout className="w-4 h-4" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

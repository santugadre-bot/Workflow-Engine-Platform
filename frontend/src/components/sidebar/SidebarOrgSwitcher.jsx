import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiChevronDown, HiOutlinePlus, HiOutlineCheckCircle } from 'react-icons/hi';
import useUIStore from '../../store/uiStore';
import { useAuth } from '../../context/AuthContext';
import { canCreateOrganization } from '../../utils/permissions';

const MAX_ORGS = 8;

function formatPlan(plan) {
    if (!plan) return 'Free';
    return plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase();
}

/** Plan badge colors — same in light and dark (uses low-opacity accent colors) */
function getPlanBadgeClass(plan) {
    const key = (plan || 'free').toLowerCase();
    const map = {
        free: 'bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400',
        starter: 'bg-slate-100 text-slate-500',
        pro: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
        professional: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
        enterprise: 'bg-violet-50 text-violet-600 border border-violet-200',
    };
    return map[key] || map.free;
}

export default function SidebarOrgSwitcher({
    organizations,
    activeOrganizationId,
    activeOrg,
    isCollapsed,
    getOrgColor,
}) {
    const navigate = useNavigate();
    const openModal = useUIStore((s) => s.openModal);
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);
    const canCreateOrg = canCreateOrganization(user?.systemRole);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleSwitch = (orgId) => {
        useUIStore.getState().setActiveOrganizationId(orgId);
        setIsOpen(false);
        navigate('/dashboard');
    };

    const visibleOrgs = (organizations || []).slice(0, MAX_ORGS);

    return (
        <div
            className="h-14 px-2 flex items-center border-b border-sidebar-border"
            ref={ref}
        >
            <div className="relative w-full">
                <button
                    onClick={() => !isCollapsed && setIsOpen(!isOpen)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all duration-150 ${isCollapsed ? 'justify-center cursor-default' : ''} ${isOpen ? 'bg-sidebar-hover-bg' : 'bg-transparent'}`}
                    title={isCollapsed ? activeOrg?.name : undefined}
                >
                    {/* Org avatar */}
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-sidebar-border shadow-lg ${getOrgColor(activeOrganizationId)}`}>
                        {activeOrg?.name?.substring(0, 2).toUpperCase() || 'O'}
                    </div>

                    {!isCollapsed && (
                        <>
                            <div className="flex-1 min-w-0 text-left">
                                <h2 className="font-semibold truncate text-sm leading-tight text-text-primary" title={activeOrg?.name}>
                                    {activeOrg?.name || 'Select Organization'}
                                </h2>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold leading-none mt-0.5 inline-block ${getPlanBadgeClass(activeOrg?.plan)}`}>
                                    {formatPlan(activeOrg?.plan)}
                                </span>
                            </div>
                            <HiChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 text-sidebar-text-muted ${isOpen ? 'rotate-180' : ''}`} />
                        </>
                    )}
                </button>

                {/* Dropdown */}
                {isOpen && !isCollapsed && (
                    <div
                        className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 bg-bg-raised border border-sidebar-border"
                    >
                        <div className="p-1.5 space-y-0.5">
                            <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-text-muted">
                                Switch Organization
                            </div>
                            {visibleOrgs.map(org => (
                                <button
                                    key={org.id}
                                    onClick={() => handleSwitch(org.id)}
                                    className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all text-left ${org.id === activeOrganizationId ? 'bg-sidebar-active-bg text-sidebar-active-text' : 'text-sidebar-text'}`}
                                >
                                    <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${getOrgColor(org.id)}`}>
                                        {org.name.substring(0, 1).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm truncate font-medium">{org.name}</span>
                                        <span className="text-[10px] text-sidebar-text-muted">{formatPlan(org.plan)}</span>
                                    </div>
                                    {org.id === activeOrganizationId && (
                                        <HiOutlineCheckCircle className="w-4 h-4 flex-shrink-0 text-sidebar-active-text" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {canCreateOrg && (
                            <div className="p-1.5 border-t border-sidebar-border">
                                <button
                                    onClick={() => { setIsOpen(false); openModal('createOrganization'); }}
                                    className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-lg transition-all text-sidebar-text"
                                >
                                    <div className="w-6 h-6 rounded flex items-center justify-center bg-sidebar-hover-bg text-sidebar-text-muted">
                                        <HiOutlinePlus className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="font-medium">Create Organization</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

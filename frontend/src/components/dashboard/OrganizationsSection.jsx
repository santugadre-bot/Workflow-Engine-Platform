import { useNavigate } from 'react-router-dom';
import { HiOutlineOfficeBuilding, HiOutlineChevronRight, HiOutlineUsers, HiPlus } from 'react-icons/hi';
import { formatDistanceToNow } from 'date-fns';

export default function OrganizationsSection({ organizations, activeOrganizationId, onSelect, onCreate }) {
    const navigate = useNavigate();

    const handleViewOrganization = (orgId) => {
        onSelect(orgId);
        // If we want to navigate to a specific organization view, we can. 
        // For now, setting it as active is the primary action in this SPA.
        // But the user asked for navigation. Let's assume navigating to the dashboard reload with that organization active IS the navigation.
        // Or specific route like /organizations/:id
        navigate(`/dashboard`);
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                <h3 className="font-semibold text-slate-800">Your Organizations</h3>
                <span className="text-xs text-slate-500">{organizations.length} Total</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {organizations.map((org) => (
                    <div
                        key={org.id}
                        className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer
                            ${org.id === activeOrganizationId
                                ? 'bg-primary/5 border-primary/20 ring-1 ring-primary/20'
                                : 'bg-white border-slate-200 hover:border-primary/30'
                            }`}
                        onClick={() => handleViewOrganization(org.id)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0
                                ${org.id === activeOrganizationId ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors'}
                            `}>
                                {org.name.charAt(0).toUpperCase()}
                            </div>
                            <button className="text-slate-400 hover:text-primary transition-colors">
                                <HiOutlineChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        <h4 className="font-semibold text-slate-800 mb-1 group-hover:text-primary transition-colors truncate">
                            {org.name}
                        </h4>
                        <p className="text-sm text-slate-500 line-clamp-2 h-10 mb-4">
                            {org.description || "No description provided."}
                        </p>

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50/50">
                            <div className="flex items-center gap-1">
                                <HiOutlineUsers className="w-3 h-3" />
                                <span>{org.members ? org.members.length : 1} Member{org.members?.length !== 1 && 's'}</span>
                            </div>
                            <span>
                                Updated {org.updatedAt ? formatDistanceToNow(new Date(org.updatedAt), { addSuffix: true }) : 'recently'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div >
    );
}

import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkNotificationRead } from '../../api/notifications';
import { useUnreadNotificationsCount } from '../../api/notifications';
import { useState, useRef, useEffect } from 'react';
import { HiOutlineBell, HiOutlineMailOpen, HiOutlineArrowRight } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const NOTIF_ICONS = {
    TASK_ASSIGNED: '📋',
    MENTION: '💬',
    SPRINT_STARTED: '🚀',
    APPROVAL_REQUIRED: '⏳',
    APPROVAL_PENDING: '⏳',
    APPROVAL_PROCESSED: '🛡️',
    DEFAULT: '🔔',
};

/**
 * NotificationDropdown — enterprise notification bell.
 *
 * - Capped to 5 most recent
 * - Click navigates to actionUrl (or /inbox) and marks as read
 * - Filter tabs: All / Unread
 * - "View all" footer link to /inbox
 * - No "Mark all as read" (moved to /inbox page)
 */
export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const { data: allNotifications, isLoading } = useNotifications();
    const { data: unreadCount } = useUnreadNotificationsCount();
    const markReadMutation = useMarkNotificationRead();

    // Cap to 5 most recent
    const notifications = (allNotifications || []).slice(0, 5);
    const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNotifClick = (n) => {
        // Mark as read
        if (!n.read) {
            markReadMutation.mutate(n.id);
        }
        // Navigate
        const dest = n.actionUrl || '/inbox';
        navigate(dest);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-lg transition-colors ${isOpen
                    ? 'bg-slate-100 text-slate-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                    }`}
                title="Notifications"
            >
                <HiOutlineBell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[9px] text-white rounded-full flex items-center justify-center font-bold border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-[1100] overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                        <span className="text-sm font-semibold text-slate-800">Notifications</span>
                        {/* Filter tabs */}
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
                            {['all', 'unread'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors capitalize ${filter === tab
                                        ? 'bg-white text-slate-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[360px] overflow-y-auto">
                        {isLoading ? (
                            <div className="p-8 flex justify-center">
                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="p-8 text-center">
                                <HiOutlineMailOpen className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                                <p className="text-xs text-slate-400">
                                    {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
                                </p>
                            </div>
                        ) : (
                            filtered.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => handleNotifClick(n)}
                                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors text-left ${!n.read ? 'bg-primary/[0.02]' : ''
                                        }`}
                                >
                                    {/* Icon */}
                                    <span className="text-base flex-shrink-0 mt-0.5">
                                        {NOTIF_ICONS[n.type] || NOTIF_ICONS.DEFAULT}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm truncate ${!n.read ? 'font-semibold text-slate-800' : 'font-medium text-slate-700'}`}>
                                            {n.title}
                                        </p>
                                        <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{n.message}</p>
                                        <p className="text-[10px] text-slate-400 mt-1">
                                            {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                    {/* Unread dot */}
                                    {!n.read && (
                                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-4 py-2.5">
                        <Link
                            to="/inbox"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                        >
                            View all notifications
                            <HiOutlineArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useMemo } from 'react';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../api/notifications';
import AppLayout from '../components/layout/AppLayout';
import { HiOutlineBell, HiOutlineMailOpen, HiOutlineCheck, HiOutlineEye, HiCheck } from 'react-icons/hi';
import { formatDistanceToNow, isToday, isYesterday, isAfter, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NOTIF_ICONS = {
    TASK_ASSIGNED: '📋',
    MENTION: '💬',
    SPRINT_STARTED: '🚀',
    APPROVAL_REQUIRED: '⏳',
    APPROVAL_PENDING: '⏳',
    APPROVAL_PROCESSED: '🛡️',
    DEFAULT: '🔔',
};

export default function InboxPage() {
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const navigate = useNavigate();

    const { data: notifications = [], isLoading } = useNotifications();
    const markReadMutation = useMarkNotificationRead();
    const markAllReadMutation = useMarkAllNotificationsRead();

    // Filter logic
    const filteredNotifications = useMemo(() => {
        if (!notifications) return [];
        return filter === 'unread' ? notifications.filter(n => !n.read) : notifications;
    }, [notifications, filter]);

    const unreadCount = notifications.filter(n => !n.read).length;

    // Grouping
    const groupedNotifications = useMemo(() => {
        const groups = {
            today: [],
            yesterday: [],
            lastWeek: [],
            older: []
        };

        filteredNotifications.forEach(n => {
            const date = new Date(n.createdAt || new Date());
            if (isToday(date)) groups.today.push(n);
            else if (isYesterday(date)) groups.yesterday.push(n);
            else if (isAfter(date, subDays(new Date(), 7))) groups.lastWeek.push(n);
            else groups.older.push(n);
        });
        return groups;
    }, [filteredNotifications]);

    const getActionUrl = (n) => {
        switch (n.type) {
            case 'TASK_ASSIGNED':
            case 'MENTION':
                return `/tasks/${n.referenceId}`;
            case 'APPROVAL_REQUIRED':
            case 'APPROVAL_PENDING':
            case 'APPROVAL_PROCESSED':
                // Route to the Approval Center for the relevant org
                return n.organizationId
                    ? `/organizations/${n.organizationId}/approvals`
                    : null;
            default:
                return null;
        }
    };

    const handleNotifClick = (n) => {
        if (!n.read) {
            markReadMutation.mutate(n.id);
        }
        const actionUrl = n.actionUrl || getActionUrl(n);
        if (actionUrl) {
            navigate(actionUrl);
        }
    };

    const handleMarkAllRead = () => {
        if (unreadCount > 0) {
            markAllReadMutation.mutate();
        }
    };

    const handleMarkRead = (e, n) => {
        e.stopPropagation();
        markReadMutation.mutate(n.id);
    };

    const renderNotificationGroup = (title, items) => {
        if (items.length === 0) return null;
        return (
            <div key={title} className="mb-12">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 pl-1">
                    {title}
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                    {items.map(n => (
                        <div
                            key={n.id}
                            onClick={() => handleNotifClick(n)}
                            className={`group relative flex items-start gap-5 p-5 hover:bg-slate-50 transition-all cursor-pointer ${!n.read ? 'bg-indigo-50/30' : ''}`}
                        >
                            {!n.read && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                            )}

                            <div className={`mt-0.5 flex-none w-11 h-11 rounded-full flex items-center justify-center text-xl shadow-sm ring-1 ring-inset ring-black/5
                                ${n.type === 'TASK_ASSIGNED' ? 'bg-blue-50 text-blue-600' :
                                    n.type === 'MENTION' ? 'bg-purple-50 text-purple-600' :
                                        n.type === 'SPRINT_STARTED' ? 'bg-emerald-50 text-emerald-600' :
                                            (n.type === 'APPROVAL_REQUIRED' || n.type === 'APPROVAL_PENDING') ? 'bg-amber-50 text-amber-600' :
                                                n.type === 'APPROVAL_PROCESSED' ? 'bg-indigo-50 text-indigo-600' :
                                                    'bg-slate-50 text-slate-500'}`
                            }>
                                {NOTIF_ICONS[n.type] || NOTIF_ICONS.DEFAULT}
                            </div>

                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-center justify-between gap-3 mb-1.5">
                                    <h4 className={`text-sm leading-6 ${!n.read ? 'font-bold text-slate-900 shadow-sm-text' : 'font-medium text-slate-700'}`}>
                                        {n.title}
                                    </h4>
                                    <span className="text-xs font-medium text-slate-400 flex-shrink-0 group-hover:hidden">
                                        {n.createdAt && formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                    </span>

                                    <div className="hidden group-hover:flex items-center gap-2">
                                        {!n.read && (
                                            <button
                                                onClick={(e) => handleMarkRead(e, n)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                title="Mark as read"
                                            >
                                                <HiCheck className="w-5 h-5" />
                                            </button>
                                        )}
                                        {n.actionUrl && (
                                            <button
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                                title="View details"
                                            >
                                                <HiOutlineEye className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{n.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <AppLayout title="Inbox">
            <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/60">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3 tracking-tight">
                            Inbox
                            {unreadCount > 0 && (
                                <span className="text-sm font-bold bg-indigo-600 text-white px-3 py-1 rounded-full shadow-sm align-middle tracking-normal">
                                    {unreadCount} new
                                </span>
                            )}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">Stay updated with your latest activity.</p>
                    </div>

                    <div className="flex items-center gap-3 mb-1">
                        <div className="flex items-center bg-slate-100/50 p-1 rounded-xl border border-slate-200">
                            {['all', 'unread'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setFilter(tab)}
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all capitalize ${filter === tab
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0 || markAllReadMutation.isPending}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${unreadCount === 0
                                ? 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm active:translate-y-0.5'
                                }`}
                        >
                            <HiOutlineCheck className="w-5 h-5" />
                            Mark all read
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="min-h-[500px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-80 space-y-6">
                            <div className="relative">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-500 rounded-full animate-spin" />
                            </div>
                            <p className="text-slate-400 font-medium animate-pulse">Checking for updates...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[500px] text-center bg-gradient-to-b from-white to-slate-50 rounded-3xl border border-slate-200 border-dashed">
                            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-slate-100">
                                <HiOutlineMailOpen className="w-12 h-12 text-indigo-200" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">
                                {filter === 'unread' ? 'All caught up!' : 'Inbox Zero'}
                            </h3>
                            <p className="text-slate-500 max-w-sm text-lg leading-relaxed px-4">
                                {filter === 'unread'
                                    ? "You have no unread notifications. Time to focus on deep work!"
                                    : "No notifications yet. We'll let you know when something happens."}
                            </p>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-2">
                            {renderNotificationGroup('Today', groupedNotifications.today)}
                            {renderNotificationGroup('Yesterday', groupedNotifications.yesterday)}
                            {renderNotificationGroup('Last 7 Days', groupedNotifications.lastWeek)}
                            {renderNotificationGroup('Older', groupedNotifications.older)}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}

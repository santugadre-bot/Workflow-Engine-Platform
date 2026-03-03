import { useState } from 'react';
import { HiOutlineTrash, HiOutlineUserAdd, HiOutlineExclamationCircle, HiX, HiCheck } from 'react-icons/hi';
import { useBulkTasks } from '../../api/bulkTasks';
import useUIStore from '../../store/uiStore';

const PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function BulkActionBar({ selectedIds, onClear, projectId, members = [] }) {
    const count = selectedIds.size;
    const bulkMutation = useBulkTasks(projectId);
    const addToast = useUIStore(s => s.addToast);

    const [assignOpen, setAssignOpen] = useState(false);
    const [priorityOpen, setPriorityOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (count === 0) return null;

    const taskIds = [...selectedIds];

    const run = (operation, payload = {}) => {
        bulkMutation.mutate(
            { taskIds, operation, payload },
            {
                onSuccess: (data) => {
                    addToast(`${data.affected} tasks updated`, 'success');
                    onClear();
                },
                onError: () => addToast('Bulk action failed', 'error'),
            }
        );
        setAssignOpen(false);
        setPriorityOpen(false);
        setConfirmDelete(false);
    };

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl shadow-2xl shadow-slate-900/40 px-4 py-3 border border-slate-700">
                {/* Count badge */}
                <div className="flex items-center gap-2 pr-3 border-r border-slate-700">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-black">
                        {count}
                    </div>
                    <span className="text-sm font-bold text-slate-200">
                        {count === 1 ? 'task' : 'tasks'} selected
                    </span>
                </div>

                {/* Assign */}
                <div className="relative">
                    <button
                        onClick={() => { setAssignOpen(o => !o); setPriorityOpen(false); setConfirmDelete(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-all"
                    >
                        <HiOutlineUserAdd className="w-4 h-4" />
                        Assign
                    </button>
                    {assignOpen && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[180px] py-1 z-50">
                            <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Assign to</div>
                            <button
                                onClick={() => run('ASSIGN', { assigneeId: '' })}
                                className="w-full text-left px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 font-medium"
                            >
                                Unassign
                            </button>
                            {members.map(m => (
                                <button
                                    key={m.userId}
                                    onClick={() => run('ASSIGN', { assigneeId: m.userId })}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                                >
                                    <div className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                                        {(m.displayName || m.email)?.[0]?.toUpperCase()}
                                    </div>
                                    {m.displayName || m.email}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Set Priority */}
                <div className="relative">
                    <button
                        onClick={() => { setPriorityOpen(o => !o); setAssignOpen(false); setConfirmDelete(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-bold transition-all"
                    >
                        <HiOutlineExclamationCircle className="w-4 h-4" />
                        Priority
                    </button>
                    {priorityOpen && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[140px] py-1 z-50">
                            <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">Set priority</div>
                            {PRIORITIES.map(p => (
                                <button
                                    key={p}
                                    onClick={() => run('SET_PRIORITY', { priority: p })}
                                    className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 font-bold"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete */}
                {!confirmDelete ? (
                    <button
                        onClick={() => { setConfirmDelete(true); setAssignOpen(false); setPriorityOpen(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-sm font-bold transition-all"
                    >
                        <HiOutlineTrash className="w-4 h-4" />
                        Delete
                    </button>
                ) : (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-rose-400 font-bold">Delete {count}?</span>
                        <button
                            onClick={() => run('DELETE')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition-all"
                        >
                            <HiCheck className="w-3.5 h-3.5" /> Yes
                        </button>
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-xs font-bold transition-all"
                        >
                            No
                        </button>
                    </div>
                )}

                {/* Clear */}
                <button
                    onClick={onClear}
                    className="ml-1 p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                    title="Clear selection"
                >
                    <HiX className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

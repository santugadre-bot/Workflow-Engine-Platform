import { useState } from 'react';
import { HiOutlineCalendar, HiOutlineFlag, HiX } from 'react-icons/hi';
import { useStartSprint } from '../../../api/sprints';
import useUIStore from '../../../store/uiStore';

export default function StartSprintModal({ isOpen, onClose, sprint, projectId }) {
    const [name, setName] = useState(sprint?.name || '');
    const [goal, setGoal] = useState(sprint?.goal || '');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() + 14); // Default 2 weeks
        return date.toISOString().split('T')[0];
    });

    const startSprintMutation = useStartSprint(projectId);
    const addToast = useUIStore((s) => s.addToast);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await startSprintMutation.mutateAsync({
                sprintId: sprint.id,
                name, goal, startDate, endDate
            });
            addToast('Sprint started successfully!', 'success');
            onClose();
        } catch (error) {
            addToast('Failed to start sprint', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-black text-slate-900">Start Sprint</h2>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{sprint.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <HiX className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sprint Name</label>
                        <input
                            type="text"
                            required
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 focus:border-primary focus:bg-white transition-all font-bold text-slate-900"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Iteration Goal</label>
                        <textarea
                            rows="3"
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-4 py-3 focus:border-primary focus:bg-white transition-all font-bold text-slate-900 text-sm"
                            placeholder="What are we delivering this sprint?"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Start Date</label>
                            <div className="relative">
                                <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 focus:border-primary focus:bg-white transition-all font-bold text-slate-900 text-sm"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">End Date</label>
                            <div className="relative">
                                <HiOutlineCalendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-3 focus:border-primary focus:bg-white transition-all font-bold text-slate-900 text-sm"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 btn btn-secondary py-4 rounded-2xl">Cancel</button>
                        <button
                            type="submit"
                            disabled={startSprintMutation.isPending}
                            className="flex-1 btn btn-primary py-4 rounded-2xl shadow-xl shadow-primary/20"
                        >
                            {startSprintMutation.isPending ? 'Starting...' : 'Start Sprint'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

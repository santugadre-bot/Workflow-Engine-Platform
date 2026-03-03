import { useRef, useState } from 'react';
import { HiOutlinePaperClip, HiOutlineTrash, HiOutlineDownload, HiOutlinePhotograph, HiOutlineDocument, HiOutlineLockClosed } from 'react-icons/hi';
import { useTaskAttachments, useUploadAttachment, useDeleteAttachment, attachmentsApi } from '../../api/attachments';
import { canAttachFile } from '../../utils/permissions';
import useUIStore from '../../store/uiStore';


function formatBytes(bytes) {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }) {
    if (mimeType?.startsWith('image/')) return <HiOutlinePhotograph className="w-5 h-5 text-blue-500" />;
    return <HiOutlineDocument className="w-5 h-5 text-slate-400" />;
}

export default function TaskAttachments({ taskId, userRole }) {
    const addToast = useUIStore(s => s.addToast);
    const fileInputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const { data: attachments = [], isLoading } = useTaskAttachments(taskId);
    const uploadMutation = useUploadAttachment(taskId);
    const deleteMutation = useDeleteAttachment(taskId);

    const handleFiles = (files) => {
        [...files].forEach(file => {
            uploadMutation.mutate(file, {
                onSuccess: () => addToast(`"${file.name}" uploaded`, 'success'),
                onError: (err) => addToast(err?.response?.data?.message || 'Upload failed', 'error'),
            });
        });
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleDelete = (attachment) => {
        if (!confirm(`Delete "${attachment.fileName}"?`)) return;
        deleteMutation.mutate(attachment.id, {
            onSuccess: () => addToast('Attachment deleted', 'success'),
            onError: () => addToast('Failed to delete attachment', 'error'),
        });
    };

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <HiOutlinePaperClip className="w-4 h-4" />
                    Attachments
                    {attachments.length > 0 && (
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full">
                            {attachments.length}
                        </span>
                    )}
                </h3>
                {canAttachFile(userRole) && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-primary hover:underline"
                        disabled={uploadMutation.isPending}
                    >
                        {uploadMutation.isPending ? 'Uploading…' : '+ Add file'}
                    </button>
                )}

            </div>

            {/* Drop zone — only for users who can upload */}
            {canAttachFile(userRole) ? (
                <div
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all mb-3
                        ${dragging
                            ? 'border-primary bg-primary/5 scale-[1.01]'
                            : 'border-border-muted hover:border-primary/40 hover:bg-bg-raised/50'}`}
                >
                    <HiOutlinePaperClip className="w-6 h-6 mx-auto mb-1 text-text-muted" />
                    <p className="text-xs text-text-muted">
                        {dragging ? 'Drop to upload' : 'Drag & drop or click to attach files (max 25 MB)'}
                    </p>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                    <HiOutlineLockClosed className="w-3.5 h-3.5 shrink-0" />
                    <span>Your role cannot upload attachments — download only.</span>
                </div>
            )}


            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
            />

            {/* Attachment list */}
            {isLoading ? (
                <div className="text-center py-3"><div className="spinner spinner-sm" /></div>
            ) : attachments.length === 0 ? (
                <p className="text-xs text-text-muted italic text-center py-2">No attachments yet.</p>
            ) : (
                <div className="space-y-2">
                    {attachments.map(a => (
                        <div
                            key={a.id}
                            className="flex items-center gap-3 p-2.5 bg-bg-raised border border-border-subtle rounded-xl group hover:border-border-muted transition-all"
                        >
                            <FileIcon mimeType={a.mimeType} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-text-primary truncate">{a.fileName}</p>
                                <p className="text-[10px] text-text-muted">{formatBytes(a.fileSizeBytes)}</p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a
                                    href={attachmentsApi.downloadUrl(taskId, a.id)}
                                    download={a.fileName}
                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-primary transition-colors"
                                    title="Download"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <HiOutlineDownload className="w-4 h-4" />
                                </a>
                                <button
                                    onClick={() => handleDelete(a)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
                                    title="Delete"
                                >
                                    <HiOutlineTrash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

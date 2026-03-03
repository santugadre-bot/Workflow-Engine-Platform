import { useEffect, useRef } from 'react';
import { HiOutlineX } from 'react-icons/hi';
import clsx from 'clsx';

/**
 * A reusable Modal component that provides a consistent layout,
 * accessibility features (focus trap, escape key), and styling.
 */
export default function Modal({
    isOpen,
    onClose,
    title,
    icon: Icon,
    children,
    maxWidth = 'max-w-2xl',
    showClose = true
}) {
    const overlayRef = useRef(null);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity"
            ref={overlayRef}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
        >
            <div className={clsx(
                "bg-bg-base border border-border-subtle rounded-xl shadow-2xl w-full flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200",
                maxWidth
            )} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border-subtle shrink-0">
                    <div className="flex items-center gap-3">
                        {Icon && (
                            <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-500 flex items-center justify-center text-xl">
                                {Icon}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-text-primary leading-tight">{title}</h2>
                        </div>
                    </div>
                    {showClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-text-muted hover:text-text-primary hover:bg-bg-raised rounded-lg transition-colors"
                        >
                            <HiOutlineX className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

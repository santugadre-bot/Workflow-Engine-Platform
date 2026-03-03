import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { HiOutlineExclamation, HiX } from 'react-icons/hi';

export default function DeleteConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title = 'Delete Item',
    message = 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmationMapString, // The string user needs to type to confirm
    isPending = false
}) {
    const [confirmInput, setConfirmInput] = useState('');
    const isConfirmed = !confirmationMapString || confirmInput === confirmationMapString;

    const handleConfirm = () => {
        if (isConfirmed) {
            onConfirm();
        }
    };

    const handleClose = () => {
        setConfirmInput('');
        onClose();
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[2000]" onClose={handleClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-bg-raised border border-border-subtle p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                                        <HiOutlineExclamation className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <Dialog.Title as="h3" className="text-lg font-bold text-text-primary mb-2">
                                            {title}
                                        </Dialog.Title>
                                        <div className="text-sm text-text-secondary mb-4">
                                            {message}
                                        </div>

                                        {confirmationMapString && (
                                            <div className="mb-4">
                                                <label className="block text-xs font-bold text-text-muted uppercase mb-2">
                                                    Type <span className="text-text-primary font-mono select-all">{confirmationMapString}</span> to confirm
                                                </label>
                                                <input
                                                    type="text"
                                                    className="input w-full font-mono text-sm"
                                                    value={confirmInput}
                                                    onChange={(e) => setConfirmInput(e.target.value)}
                                                    placeholder={confirmationMapString}
                                                    autoPaste="off" // Force typing for maximum safety
                                                />
                                            </div>
                                        )}

                                        <div className="flex justify-end gap-3">
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                onClick={handleClose}
                                                disabled={isPending}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-primary bg-danger border-danger hover:bg-danger-hover text-white"
                                                onClick={handleConfirm}
                                                disabled={!isConfirmed || isPending}
                                            >
                                                {isPending ? <span className="spinner" /> : 'Delete Permanently'}
                                            </button>
                                        </div>
                                    </div>
                                    <button onClick={handleClose} className="shrink-0 text-text-muted hover:text-text-primary">
                                        <HiX className="w-5 h-5" />
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

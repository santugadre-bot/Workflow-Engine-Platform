import { Fragment } from 'react';
import { HiOutlineQuestionMarkCircle, HiOutlineBookOpen, HiOutlineSupport, HiOutlineExternalLink, HiOutlineTerminal } from 'react-icons/hi';
import { Menu, Transition } from '@headlessui/react';

const APP_VERSION = import.meta.env.VITE_APP_VERSION || '1.0.0';

const KEYBOARD_SHORTCUTS = [
    { keys: ['Ctrl', 'K'], label: 'Open command palette' },
    { keys: ['/'], label: 'Search (when not in input)' },
    { keys: ['G', 'D'], label: 'Go to Dashboard' },
    { keys: ['G', 'T'], label: 'Go to My Tasks' },
    { keys: ['G', 'I'], label: 'Go to Inbox' },
    { keys: ['Esc'], label: 'Close modal / panel' },
];

/**
 * TopbarHelpMenu — ? icon button with help dropdown.
 *
 * Content: keyboard shortcuts, docs link, support link, version.
 * No feature tours. No marketing.
 */
export default function TopbarHelpMenu() {
    return (
        <Menu as="div" className="relative">
            {({ open }) => (
                <>
                    <Menu.Button
                        className={`p-2 rounded-lg transition-colors ${open
                                ? 'bg-slate-100 text-slate-700'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        title="Help & shortcuts"
                    >
                        <HiOutlineQuestionMarkCircle className="w-5 h-5" />
                    </Menu.Button>

                    <Transition
                        show={open}
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                    >
                        <Menu.Items className="absolute right-0 mt-2 w-72 origin-top-right bg-white border border-slate-200 rounded-xl shadow-xl focus:outline-none z-[1100] overflow-hidden">

                            {/* Keyboard Shortcuts */}
                            <div className="px-3 pt-3 pb-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <HiOutlineTerminal className="w-3.5 h-3.5 text-slate-400" />
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Keyboard Shortcuts</p>
                                </div>
                                <div className="space-y-1.5">
                                    {KEYBOARD_SHORTCUTS.map((shortcut) => (
                                        <div key={shortcut.label} className="flex items-center justify-between">
                                            <span className="text-xs text-slate-600">{shortcut.label}</span>
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, i) => (
                                                    <span key={i} className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded">
                                                        {key}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 mx-3" />

                            {/* Links */}
                            <div className="p-1.5 space-y-0.5">
                                <Menu.Item>
                                    {({ active }) => (
                                        <a
                                            href="https://docs.workflowengine.io"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`${active ? 'bg-slate-50' : ''} flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg transition-colors`}
                                        >
                                            <HiOutlineBookOpen className="w-4 h-4 text-slate-400" />
                                            Documentation
                                            <HiOutlineExternalLink className="w-3.5 h-3.5 text-slate-300 ml-auto" />
                                        </a>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <a
                                            href="mailto:support@workflowengine.io"
                                            className={`${active ? 'bg-slate-50' : ''} flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg transition-colors`}
                                        >
                                            <HiOutlineSupport className="w-4 h-4 text-slate-400" />
                                            Contact Support
                                        </a>
                                    )}
                                </Menu.Item>
                            </div>

                            {/* Version */}
                            <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50">
                                <p className="text-[10px] text-slate-400">
                                    WorkflowEngine v{APP_VERSION}
                                </p>
                            </div>
                        </Menu.Items>
                    </Transition>
                </>
            )}
        </Menu>
    );
}

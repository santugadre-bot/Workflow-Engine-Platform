import { useState, useRef, useEffect } from 'react';

/**
 * Textarea with @mention autocomplete.
 * Props:
 *   value, onChange — controlled textarea value
 *   members — array of { userId, displayName, email }
 *   placeholder, className, onKeyDown
 */
export default function MentionInput({ value, onChange, members = [], placeholder, className, onKeyDown }) {
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionStart, setMentionStart] = useState(-1);
    const textareaRef = useRef(null);

    const filteredMembers = members
        .filter(m => {
            const name = (m.displayName || m.email || '').toLowerCase();
            return name.includes(mentionQuery.toLowerCase());
        })
        .slice(0, 6);

    const handleChange = (e) => {
        const text = e.target.value;
        const cursor = e.target.selectionStart;

        // Detect @mention trigger
        const textBeforeCursor = text.slice(0, cursor);
        const atMatch = textBeforeCursor.match(/@(\w*)$/);

        if (atMatch) {
            setMentionQuery(atMatch[1]);
            setMentionStart(cursor - atMatch[0].length);
            setMentionOpen(true);
        } else {
            setMentionOpen(false);
            setMentionStart(-1);
        }

        onChange(text);
    };

    const insertMention = (member) => {
        const name = member.displayName || member.email;
        const before = value.slice(0, mentionStart);
        const after = value.slice(textareaRef.current?.selectionStart || mentionStart + mentionQuery.length + 1);
        const newValue = `${before}@${name} ${after}`;
        onChange(newValue);
        setMentionOpen(false);
        setMentionStart(-1);
        // Restore focus
        setTimeout(() => {
            if (textareaRef.current) {
                const pos = before.length + name.length + 2;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(pos, pos);
            }
        }, 0);
    };

    // Render @mentions in blue in the displayed text (visual only via CSS)
    const renderContent = (text) => {
        if (!text) return null;
        return text.split(/(@\w+)/g).map((part, i) =>
            part.startsWith('@')
                ? <span key={i} className="text-primary font-semibold">{part}</span>
                : part
        );
    };

    return (
        <div className="relative flex-1">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setMentionOpen(false);
                    onKeyDown?.(e);
                }}
                placeholder={placeholder}
                className={className}
            />

            {/* Mention dropdown */}
            {mentionOpen && filteredMembers.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 bg-white border border-slate-200 rounded-xl shadow-xl min-w-[200px] py-1 z-50 animate-in fade-in duration-150">
                    <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-wider">Mention</div>
                    {filteredMembers.map(m => (
                        <button
                            key={m.userId}
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); insertMention(m); }}
                            className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        >
                            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center flex-shrink-0">
                                {(m.displayName || m.email)?.[0]?.toUpperCase()}
                            </div>
                            <span className="font-medium">{m.displayName || m.email}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

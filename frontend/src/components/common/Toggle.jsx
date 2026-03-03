export default function Toggle({ checked, onChange, label, disabled = false }) {
    return (
        <label className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <div className="relative">
                <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                />
                <div className={`w-10 h-6 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-primary' : 'bg-muted'}`}></div>
                <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${checked ? 'translate-x-4' : ''}`}></div>
            </div>
            {label && <span className="text-sm font-medium select-none group-hover:text-primary transition-colors">{label}</span>}
        </label>
    );
}

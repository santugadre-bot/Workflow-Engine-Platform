import { useState, forwardRef } from 'react';
import { HiEye, HiEyeOff, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { CgSpinner } from 'react-icons/cg';

const AuthInput = forwardRef(({
    id,
    label,
    type = 'text',
    placeholder,
    error,
    success,
    loading,
    icon: Icon,
    ...props
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    // If it's a password field, users need to see the toggle to fix errors.
    // So we prioritize valid toggle behavior over status icons inside the input.
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Determine border color based on state
    let borderColor = 'border-slate-200 dark:border-slate-700';
    let focusRing = 'focus:ring-blue-500/10 focus:border-blue-500';
    let iconColor = 'text-slate-400';

    if (error) {
        borderColor = 'border-red-500 dark:border-red-500';
        focusRing = 'focus:ring-red-500/10 focus:border-red-500';
        iconColor = 'text-red-500';
    } else if (success) {
        borderColor = 'border-green-500 dark:border-green-500';
        focusRing = 'focus:ring-green-500/10 focus:border-green-500';
        iconColor = 'text-green-500';
    }

    return (
        <div className="space-y-1.5 group">
            {label && (
                <label htmlFor={id} className="block text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                    {label} {props.required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors duration-200 ${iconColor} group-focus-within:text-blue-500`}>
                        <Icon className="h-5 w-5" />
                    </div>
                )}

                <input
                    ref={ref}
                    id={id}
                    className={`
                        input-premium w-full h-11 
                        ${Icon ? 'pl-11' : 'pl-4'}
                        ${isPassword ? 'pr-11' : (loading || success || error ? 'pr-11' : 'pr-4')}
                        ${error || success ? `${borderColor} ${focusRing}` : ''}
                        placeholder:text-slate-400
                        focus:scale-[1.01] origin-left
                    `}
                    type={inputType}
                    placeholder={placeholder}
                    aria-invalid={Boolean(error)}
                    {...props}
                />

                {/* Right Actions */}
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                    {isPassword ? (
                        <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <HiEyeOff className="h-5 w-5" aria-hidden="true" />
                            ) : (
                                <HiEye className="h-5 w-5" aria-hidden="true" />
                            )}
                        </button>
                    ) : loading ? (
                        <CgSpinner className="h-5 w-5 animate-spin text-blue-500" />
                    ) : error ? (
                        <HiExclamationCircle className="h-5 w-5 text-red-500" />
                    ) : success ? (
                        <HiCheckCircle className="h-5 w-5 text-green-500" />
                    ) : null}
                </div>
            </div>

            {error && (
                <p className="text-xs text-red-500 font-medium pl-1 animate-pulse" role="alert">{error}</p>
            )}
        </div>
    );
});

AuthInput.displayName = 'AuthInput';
export default AuthInput;

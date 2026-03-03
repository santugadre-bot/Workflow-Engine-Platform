import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/authSchemas';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import AuthInput from '../components/auth/AuthInput';
import { CgSpinner } from 'react-icons/cg';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

export default function RegisterPage() {
    const [authError, setAuthError] = useState('');
    const [socialLoading, setSocialLoading] = useState(null);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            displayName: '',
            email: '',
            password: ''
        }
    });

    const passwordValue = watch('password');

    // Calculate Password Strength
    useEffect(() => {
        if (!passwordValue) {
            setPasswordStrength(0);
            return;
        }
        let score = 0;
        if (passwordValue.length > 7) score += 30;
        if (passwordValue.length > 11) score += 10;
        if (/[A-Z]/.test(passwordValue)) score += 20;
        if (/[0-9]/.test(passwordValue)) score += 20;
        if (/[^A-Za-z0-9]/.test(passwordValue)) score += 20;
        setPasswordStrength(Math.min(100, score));
    }, [passwordValue]);

    const getStrengthColor = () => {
        if (passwordStrength < 40) return '#ef4444'; // Red
        if (passwordStrength < 80) return '#f59e0b'; // Orange
        return '#10b981'; // Green
    };

    const onSubmit = async (data) => {
        setAuthError('');
        try {
            const response = await authApi.register(data);
            login(response);
            navigate('/dashboard');
        } catch (err) {
            setAuthError(err.response?.data?.message || 'Registration failed');
        }
    };

    const handleSocialLogin = (provider) => {
        setSocialLoading(provider);
        setTimeout(() => {
            setSocialLoading(null);
            setAuthError(`${provider} registration not implemented in demo`);
        }, 1500);
    };

    return (
        <AuthShell>
            {/* Header */}
            <div className="mb-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="flex justify-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h1>
                <p className="text-slate-500 text-sm mt-2">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                        Log in
                    </Link>
                </p>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">

                {/* Social Stack (Top) */}
                <div className="space-y-3">
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('Google')}
                        disabled={!!socialLoading}
                        className="hero-btn-secondary w-full justify-center h-11 px-4 gap-3 text-sm font-semibold hover:bg-slate-50 transition-all"
                    >
                        {socialLoading === 'Google' ? (
                            <CgSpinner className="w-5 h-5 animate-spin text-blue-500" />
                        ) : (
                            <>
                                <FcGoogle className="w-5 h-5" />
                                <span>Sign up with Google</span>
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSocialLogin('GitHub')}
                        disabled={!!socialLoading}
                        className="hero-btn-secondary w-full justify-center h-11 px-4 gap-3 text-sm font-semibold hover:bg-slate-50 text-slate-700 border-slate-200 transition-all"
                    >
                        {socialLoading === 'GitHub' ? (
                            <CgSpinner className="w-5 h-5 animate-spin text-slate-900" />
                        ) : (
                            <>
                                <FaGithub className="w-5 h-5 text-slate-900" />
                                <span>Sign up with GitHub</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider font-medium">
                        <span className="bg-white px-3 text-slate-400">or</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {authError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm font-medium flex items-center gap-2 animate-shake">
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {authError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <AuthInput
                            id="displayName"
                            label="Full name"
                            type="text"
                            autoComplete="name"
                            placeholder="" // Clean
                            icon={null}
                            error={errors.displayName?.message}
                            disabled={isSubmitting}
                            {...register('displayName')}
                        />

                        <AuthInput
                            id="email"
                            label="Work email"
                            type="email"
                            autoComplete="email"
                            placeholder=""
                            icon={null}
                            error={errors.email?.message}
                            disabled={isSubmitting}
                            {...register('email')}
                        />

                        <div>
                            <AuthInput
                                id="password"
                                label="Password"
                                type="password"
                                autoComplete="new-password"
                                placeholder=""
                                icon={null}
                                error={errors.password?.message}
                                disabled={isSubmitting}
                                {...register('password')}
                            />
                            {/* Strength Meter - Keeping subtle */}
                            {passwordValue && (
                                <div className="mt-2 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300 ease-out"
                                        style={{
                                            width: `${passwordStrength}%`,
                                            backgroundColor: getStrengthColor()
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="hero-btn-primary w-full justify-center text-base shadow-indigo-500/25 bg-gradient-to-br from-indigo-500 to-indigo-600"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <CgSpinner className="w-5 h-5 animate-spin" />
                                <span>Creating Account...</span>
                            </div>
                        ) : 'Sign Up'}
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center">
                <a href="#" className="text-xs text-slate-400 hover:text-slate-500 transition-colors">By signing up you agree to our Terms and Privacy Policy</a>
            </div>
        </AuthShell>
    );
}

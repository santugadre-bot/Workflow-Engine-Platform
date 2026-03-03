import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/authSchemas';
import { authApi } from '../api';
import { useAuth } from '../context/AuthContext';
import AuthShell from '../components/auth/AuthShell';
import AuthInput from '../components/auth/AuthInput';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';
import { CgSpinner } from 'react-icons/cg';

export default function LoginPage() {
    const [authError, setAuthError] = useState('');
    const [socialLoading, setSocialLoading] = useState(null); // 'google' | 'github' | null
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false
        }
    });

    const onSubmit = async (data) => {
        setAuthError('');
        try {
            const response = await authApi.login(data);
            login(response);
            navigate('/dashboard');
        } catch (err) {
            setAuthError(err.response?.data?.message || 'Invalid email or password');
        }
    };

    const handleSocialLogin = (provider) => {
        setSocialLoading(provider);
        // Simulate connection delay
        setTimeout(() => {
            setSocialLoading(null);
            setAuthError(`${provider} login not implemented in demo`);
        }, 1500);
    };

    return (
        <AuthShell>
            {/* Header Section (Reference: "Welcome back!") */}
            <div className="mb-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="flex justify-center mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back!</h1>
                <p className="text-slate-500 text-sm mt-2">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">

                {/* Social Login Stack (Top, Full Width) */}
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
                                <span>Continue with Google</span>
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
                                <span>Continue with GitHub</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Divider "or" */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase tracking-wider font-medium">
                        <span className="bg-white px-3 text-slate-400">or</span>
                    </div>
                </div>

                {/* Main Form */}
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
                            id="email"
                            label="Work email"
                            type="email"
                            autoComplete="email"
                            placeholder="" // Clean look like reference
                            icon={null} // Reference has no outside icon, maybe inside? Keeping clean for now visually
                            error={errors.email?.message}
                            disabled={isSubmitting}
                            {...register('email')}
                        />

                        <AuthInput
                            id="password"
                            label="Password"
                            type="password"
                            autoComplete="current-password"
                            placeholder=""
                            icon={null}
                            error={errors.password?.message}
                            disabled={isSubmitting}
                            {...register('password')}
                        />
                    </div>

                    <button
                        type="submit"
                        className="hero-btn-primary w-full justify-center text-base shadow-indigo-500/25 bg-gradient-to-br from-indigo-500 to-indigo-600"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center gap-2">
                                <CgSpinner className="w-5 h-5 animate-spin" />
                                <span>Logging In...</span>
                            </div>
                        ) : 'Log In'}
                    </button>

                    <div className="text-center">
                        <Link to="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors">
                            Forgot Password?
                        </Link>
                    </div>
                </form>
            </div>

            <div className="mt-8 text-center">
                <a href="#" className="text-xs text-slate-400 hover:text-slate-500 transition-colors">Need help?</a>
            </div>
        </AuthShell>
    );
}

import { Link } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi';

/**
 * AuthShell — full-bleed animated background with centered glass card.
 * Used by LoginPage and RegisterPage.
 *
 * Light mode: soft slate radial gradient background
 * Dark mode: animated aurora gradient background
 */
export default function AuthShell({ children }) {
    return (
        <div
            className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
            style={{ background: 'var(--bg-base)' }}
        >
            {/* Background layer — aurora in dark, soft radial in light */}
            <div
                className="absolute inset-0 pointer-events-none auth-shell-bg"
                aria-hidden="true"
            />

            {/* Dot grid */}
            <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, var(--canvas-dot) 1px, transparent 0)',
                    backgroundSize: '28px 28px',
                }}
                aria-hidden="true"
            />

            <div className="w-full max-w-[440px] relative z-10">
                {/* Back to Home */}
                <div className="mb-6">
                    <Link
                        to="/"
                        className="inline-flex items-center text-sm font-medium transition-colors gap-2 group hover:text-indigo-500"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <HiArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                </div>

                {/* Auth Card — light: white crisp card, dark: frosted glass */}
                <div
                    className="auth-shell-card relative overflow-hidden rounded-2xl p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-300"
                >
                    {children}
                </div>

                {/* Footer */}
                <div className="mt-8 text-center">
                    <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        &copy; 2026 Workflow Engine Inc. ·{' '}
                        <a href="#" className="hover:text-indigo-500 transition-colors">Privacy</a>
                        {' · '}
                        <a href="#" className="hover:text-indigo-500 transition-colors">Terms</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

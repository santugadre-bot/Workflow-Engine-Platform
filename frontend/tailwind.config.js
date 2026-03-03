/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: 'rgb(var(--primary-rgb) / <alpha-value>)',
                'primary-hover': 'rgb(var(--primary-hover-rgb) / <alpha-value>)',
                'primary-active': 'rgb(var(--primary-active-rgb) / <alpha-value>)',
                accent: 'rgb(var(--primary-rgb) / <alpha-value>)', /* Alias for backward compatibility */
                bg: {
                    base: 'rgb(var(--bg-base-rgb) / <alpha-value>)',
                    raised: 'rgb(var(--bg-raised-rgb) / <alpha-value>)',
                    overlay: 'rgb(var(--bg-overlay-rgb) / <alpha-value>)',
                    card: 'rgb(var(--bg-card-rgb) / <alpha-value>)',
                    hover: 'rgb(var(--bg-hover-rgb) / <alpha-value>)',
                    active: 'rgb(var(--bg-active-rgb) / <alpha-value>)',
                },
                text: {
                    primary: 'rgb(var(--text-primary-rgb) / <alpha-value>)',
                    secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
                    muted: 'rgb(var(--text-muted-rgb) / <alpha-value>)',
                    placeholder: 'rgb(var(--text-placeholder-rgb) / <alpha-value>)',
                    inverse: 'rgb(var(--text-inverse-rgb) / <alpha-value>)',
                },
                border: {
                    subtle: 'rgb(var(--border-subtle-rgb) / <alpha-value>)',
                    muted: 'rgb(var(--border-muted-rgb) / <alpha-value>)',
                    default: 'rgb(var(--border-default-rgb) / <alpha-value>)',
                },
                danger: 'rgb(var(--danger-rgb) / <alpha-value>)',
                success: 'rgb(var(--success-rgb) / <alpha-value>)',
                warning: 'rgb(var(--warning-rgb) / <alpha-value>)',
                info: 'rgb(var(--info-rgb) / <alpha-value>)',

                /* Sidebar explicit colors */
                sidebar: {
                    bg: 'var(--sidebar-bg)',
                    surface: 'var(--sidebar-surface)',
                    text: 'var(--sidebar-text)',
                    'text-muted': 'var(--sidebar-text-muted)',
                    'active-bg': 'var(--sidebar-active-bg)',
                    'active-border': 'var(--sidebar-active-border)',
                    'active-bar': 'var(--sidebar-active-bar)',
                    'active-text': 'var(--sidebar-active-text)',
                    'hover-bg': 'var(--sidebar-hover-bg)',
                }
            },
            spacing: {
                'sp-1': 'var(--sp-1)',
                'sp-2': 'var(--sp-2)',
                'sp-3': 'var(--sp-3)',
                'sp-4': 'var(--sp-4)',
                'sp-5': 'var(--sp-5)',
                'sp-6': 'var(--sp-6)',
                'sp-8': 'var(--sp-8)',
                'sp-10': 'var(--sp-10)',
                'sp-12': 'var(--sp-12)',
                'sp-16': 'var(--sp-16)',
            },
            borderRadius: {
                'radius-sm': 'var(--radius-sm)',
                'radius-md': 'var(--radius-md)',
                'radius-lg': 'var(--radius-lg)',
                'radius-xl': 'var(--radius-xl)',
                'radius-full': 'var(--radius-full)',
            },
            boxShadow: {
                'shadow-sm': 'var(--shadow-sm)',
                'shadow-md': 'var(--shadow-md)',
                'shadow-lg': 'var(--shadow-lg)',
                'shadow-glow': 'var(--shadow-glow)',
            },
            fontSize: {
                'font-xs': 'var(--font-xs)',
                'font-sm': 'var(--font-sm)',
                'font-md': 'var(--font-md)',
                'font-lg': 'var(--font-lg)',
                'font-xl': 'var(--font-xl)',
                'font-2xl': 'var(--font-2xl)',
                'font-3xl': 'var(--font-3xl)',
            },
            animation: {
                'aurora': 'aurora 20s linear infinite',
                'slow-spin': 'spin 30s linear infinite',
            },
            keyframes: {
                aurora: {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}

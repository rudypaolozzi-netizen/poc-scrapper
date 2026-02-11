/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1E40AF',
                secondary: '#1E293B',
                accent: '#22C55E', // Green for success/start
                danger: '#EF4444', // Red for stop
                background: '#0F172A', // Dark blue/grey
                surface: '#1E293B', // Slightly lighter for cards
                text: '#F8FAFC', // Off-white
                muted: '#94A3B8', // Muted text
                'log-bg': '#0D1117', // Terminal black
                'log-text': '#4ADE80', // Terminal green
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['"Courier New"', 'monospace'],
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
}

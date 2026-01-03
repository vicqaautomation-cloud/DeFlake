/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#09090b', // slate-950
                surface: '#18181b', // slate-900 
                primary: '#10b981', // emerald-500
                secondary: '#6366f1', // indigo-500
            }
        },
    },
    plugins: [],
}

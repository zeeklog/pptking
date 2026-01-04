import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./src/components/**/*.{ts,tsx}",
		"./src/pages/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)',
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				destructive: {
					DEFAULT: 'rgb(var(--destructive))',
					foreground: 'rgb(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar-background)',
					foreground: 'var(--sidebar-foreground)',
					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',
					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',
					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				},
				// 自定义颜色系统
				purple: {
					50: '#EEF2FF',
					100: '#E0E7FF',
					200: '#C7D2FE',
					300: '#A5B4FC',
					400: '#818CF8',
					500: '#6366F1',
					600: '#4F46E5',
					700: '#4338CA',
					800: '#3730A3',
					900: '#312E81',
				},
				tech: {
					50: '#F9FAFB',
					100: '#F3F4F6',
					200: '#E5E7EB',
					300: '#D1D5DB',
					400: '#9CA3AF',
					500: '#6B7280',
					600: '#4B5563',
					700: '#374151',
					800: '#1F2937',
					900: '#111827',
				},
				success: {
					50: '#D1FAE5',
					100: '#A7F3D0',
					200: '#6EE7B7',
					300: '#34D399',
					400: '#10B981',
					500: '#059669',
					600: '#047857',
					700: '#065F46',
					800: '#064E3B',
					900: '#064E3B',
				},
				error: {
					50: '#FEE2E2',
					100: '#FECACA',
					200: '#FCA5A5',
					300: '#F87171',
					400: '#EF4444',
					500: '#DC2626',
					600: '#B91C1C',
					700: '#991B1B',
					800: '#7F1D1D',
					900: '#7F1D1D',
				},
				warning: {
					50: '#FEF3C7',
					100: '#FDE68A',
					200: '#FCD34D',
					300: '#FBBF24',
					400: '#F59E0B',
					500: '#D97706',
					600: '#B45309',
					700: '#92400E',
					800: '#78350F',
					900: '#78350F',
				},
				info: {
					50: '#DBEAFE',
					100: '#BFDBFE',
					200: '#93C5FD',
					300: '#60A5FA',
					400: '#3B82F6',
					500: '#2563EB',
					600: '#1D4ED8',
					700: '#1E40AF',
					800: '#1E3A8A',
					900: '#1E3A8A',
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				"accordion-down": {
					from: { height: "0" },
					to: { height: "var(--radix-accordion-content-height)" },
				},
				"accordion-up": {
					from: { height: "var(--radix-accordion-content-height)" },
					to: { height: "0" },
				},
				"fade-in": {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				"bounce-in": {
					"0%": { opacity: "0", transform: "scale(0.3)" },
					"50%": { opacity: "1", transform: "scale(1.05)" },
					"70%": { transform: "scale(0.9)" },
					"100%": { opacity: "1", transform: "scale(1)" },
				},
				"pulse-slow": {
					"0%, 100%": { opacity: "0.3" },
					"50%": { opacity: "0.6" },
				},
			},
			animation: {
				"accordion-down": "accordion-down 0.2s ease-out",
				"accordion-up": "accordion-up 0.2s ease-out",
				"fade-in": "fade-in 0.6s ease-out",
				"bounce-in": "bounce-in 0.8s ease-out",
				"pulse-slow": "pulse-slow 3s ease-in-out infinite",
			},
			boxShadow: {
				'purple-sm': '0 2px 4px rgba(99, 102, 241, 0.05)',
				'purple-md': '0 4px 6px rgba(99, 102, 241, 0.1)',
				'purple-lg': '0 8px 16px rgba(99, 102, 241, 0.15)',
				'purple-xl': '0 12px 20px rgba(99, 102, 241, 0.2)',
			},
		},
	},
	plugins: [require("tailwindcss-animate")],
}

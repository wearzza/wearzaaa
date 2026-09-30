/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: { colors: {
      background: 'hsl(var(--background) / <alpha-value>)',
      foreground: 'hsl(var(--foreground) / <alpha-value>)',
      card: 'hsl(var(--card) / <alpha-value>)',
      primary: { DEFAULT: 'hsl(var(--primary) / <alpha-value>)', foreground: 'hsl(var(--primary-foreground) / <alpha-value>)' },
      muted: { DEFAULT: 'hsl(var(--muted) / <alpha-value>)', foreground: 'hsl(var(--muted-foreground) / <alpha-value>)' },
      border: 'hsl(var(--border) / <alpha-value>)',
      destructive: 'hsl(var(--destructive) / <alpha-value>)',
      chart: { blue: 'var(--chart-blue)', green: 'var(--chart-green)' },
    } },
  },
  plugins: [],
};

/**
 * Meu Condomínio Fácil - Theme Configuration
 * Modern Design System with Green Color Palette
 */

export const colors = {
    primary: {
        50: '#f0fdf4',
        100: '#dcfce7',
        200: '#bbf7d0',
        300: '#86efac',
        400: '#4ade80',
        500: '#22c55e',  // Main primary
        600: '#16a34a',
        700: '#15803d',
        800: '#166534',
        900: '#14532d',
    },
    secondary: {
        400: '#22d3ee',
        500: '#06b6d4',  // Cyan for notifications
        600: '#0891b2',
    },
    warning: {
        100: '#fef3c7',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
    },
    error: {
        100: '#fee2e2',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
    },
    purple: {
        100: '#f3e8ff',
        400: '#c084fc',
        500: '#a855f7',  // AI/Tech features
        600: '#9333ea',
    },
    gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#4b5563',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
    },
    white: '#ffffff',
    black: '#000000',
    success: '#22c55e',
    info: '#3b82f6',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
    '5xl': 48,
};

export const borderRadius = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    full: 9999,
};

export const typography = {
    fontSizes: {
        xs: 10,
        sm: 12,
        base: 14,
        md: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
    },
    fontWeights: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
    },
    lineHeights: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 12,
    },
    primary: {
        shadowColor: colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
};

export const glassmorphism = {
    background: 'rgba(255, 255, 255, 0.9)',
    borderColor: `rgba(34, 197, 94, 0.2)`,
    backdropBlur: 10,
};

export default {
    colors,
    spacing,
    borderRadius,
    typography,
    shadows,
    glassmorphism,
};

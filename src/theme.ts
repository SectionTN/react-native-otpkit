export const palettes = {
  light: {
    text: '#0A0A0A',
    placeholder: '#A3A3A3',
    border: '#D4D4D4',
    active: '#2563EB',
    error: '#DC2626',
    success: '#16A34A',
    cell: '#FFFFFF',
    disabled: '#F5F5F5',
    caret: '#2563EB',
  },
  dark: {
    text: '#FAFAFA',
    placeholder: '#737373',
    border: '#404040',
    active: '#60A5FA',
    error: '#F87171',
    success: '#4ADE80',
    cell: '#171717',
    disabled: '#262626',
    caret: '#60A5FA',
  },
} as const;

export type Palette = { [K in keyof typeof palettes.light]: string };

export const metrics = {
  height: 56,
  maxWidth: 52,
  gap: 8,
  radius: 12,
  borderWidth: 1.5,
  activeBorderWidth: 2,
  fontSize: 24,
  dashWidth: 10,
  dashHeight: 2,
} as const;

// UIKit skips hit-testing below 0.01 alpha
export const HIDDEN_INPUT_OPACITY = 0.011;

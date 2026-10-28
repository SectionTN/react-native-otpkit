import { useColorScheme } from 'react-native';

const palettes = {
  light: {
    background: '#F5F5F5',
    card: '#FFFFFF',
    text: '#0A0A0A',
    secondaryText: '#525252',
    separator: '#D4D4D4',
    accent: '#2563EB',
    onAccent: '#FFFFFF',
  },
  dark: {
    background: '#0A0A0A',
    card: '#171717',
    text: '#FAFAFA',
    secondaryText: '#A3A3A3',
    separator: '#404040',
    accent: '#60A5FA',
    onAccent: '#0A0A0A',
  },
} as const;

export type Theme = { [K in keyof typeof palettes.light]: string };

export function useTheme(): Theme {
  return palettes[useColorScheme() === 'dark' ? 'dark' : 'light'];
}

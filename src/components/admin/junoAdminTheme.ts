import { defineTheme } from '@astryxdesign/core/theme';

export const junoAdminTheme = defineTheme({
  name: 'juno-admin',
  color: { neutralStyle: 'cool', contrast: 'high' },
  tokens: {
    '--color-accent': ['#e11d48', '#fb7185'],
    '--color-background-body': ['#f8fafc', '#080808'],
    '--color-background-surface': ['#ffffff', '#111111'],
    '--color-text-primary': ['#171717', '#ffffff'],
    '--color-text-secondary': ['#525252', '#a3a3a3'],
    '--radius-container': '16px',
  },
  components: {
    button: {
      'variant:primary': { backgroundColor: '#e11d48', color: '#ffffff' },
    },
  },
});

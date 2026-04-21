// ── Roomio Theme Engine ──────────────────────────────────────────
// All components read CSS variables — themes work by swapping these vars.
// Tailwind static classes like bg-dark-card DON'T change with themes.
// Use inline styles with var(--card) etc. for theme-aware components.

export const THEMES = {
  dark: {
    label: 'Dark', desc: 'Deep space dark',
    preview: ['#0f1117', '#161b27', '#00c853'],
    vars: {
      '--bg':          '#0f1117',
      '--card':        '#161b27',
      '--card2':       '#1a2235',
      '--border':      '#1e293b',
      '--border2':     '#243047',
      '--text':        '#f1f5f9',
      '--muted':       '#94a3b8',
      '--subtle':      '#475569',
      '--accent':      '#00c853',
      '--accent-dim':  '#00a844',
      '--accent-text': '#0f1117',
    },
  },
  midnight: {
    label: 'Midnight', desc: 'Pure black OLED',
    preview: ['#000000', '#0a0a0a', '#6366f1'],
    vars: {
      '--bg':          '#000000',
      '--card':        '#0a0a0a',
      '--card2':       '#111111',
      '--border':      '#1a1a1a',
      '--border2':     '#222222',
      '--text':        '#f1f5f9',
      '--muted':       '#6b7280',
      '--subtle':      '#374151',
      '--accent':      '#6366f1',
      '--accent-dim':  '#4f46e5',
      '--accent-text': '#ffffff',
    },
  },
  forest: {
    label: 'Forest', desc: 'Deep green nature',
    preview: ['#0a1a12', '#0f2418', '#22c55e'],
    vars: {
      '--bg':          '#0a1a12',
      '--card':        '#0f2418',
      '--card2':       '#14301f',
      '--border':      '#1a3d28',
      '--border2':     '#225235',
      '--text':        '#ecfdf5',
      '--muted':       '#86efac',
      '--subtle':      '#4ade80',
      '--accent':      '#22c55e',
      '--accent-dim':  '#16a34a',
      '--accent-text': '#0a1a12',
    },
  },
  ocean: {
    label: 'Ocean', desc: 'Deep blue vibes',
    preview: ['#050d1a', '#0c1a2e', '#3b82f6'],
    vars: {
      '--bg':          '#050d1a',
      '--card':        '#0c1a2e',
      '--card2':       '#0f2040',
      '--border':      '#162840',
      '--border2':     '#1e3555',
      '--text':        '#eff6ff',
      '--muted':       '#93c5fd',
      '--subtle':      '#60a5fa',
      '--accent':      '#3b82f6',
      '--accent-dim':  '#2563eb',
      '--accent-text': '#ffffff',
    },
  },
  sunset: {
    label: 'Sunset', desc: 'Warm amber tones',
    preview: ['#1a0f05', '#2a1708', '#f59e0b'],
    vars: {
      '--bg':          '#1a0f05',
      '--card':        '#2a1708',
      '--card2':       '#351f0a',
      '--border':      '#4a2d0f',
      '--border2':     '#5e3a14',
      '--text':        '#fffbeb',
      '--muted':       '#fcd34d',
      '--subtle':      '#fbbf24',
      '--accent':      '#f59e0b',
      '--accent-dim':  '#d97706',
      '--accent-text': '#1a0f05',
    },
  },
  purple: {
    label: 'Galaxy', desc: 'Cosmic purple',
    preview: ['#0d0a1a', '#160f2a', '#a855f7'],
    vars: {
      '--bg':          '#0d0a1a',
      '--card':        '#160f2a',
      '--card2':       '#1e1535',
      '--border':      '#2d1d50',
      '--border2':     '#3d2868',
      '--text':        '#faf5ff',
      '--muted':       '#c4b5fd',
      '--subtle':      '#a78bfa',
      '--accent':      '#a855f7',
      '--accent-dim':  '#9333ea',
      '--accent-text': '#ffffff',
    },
  },
  light: {
    label: 'Light', desc: 'Clean & bright',
    preview: ['#f8fafc', '#ffffff', '#006633'],
    vars: {
      '--bg':          '#f0f4f0',
      '--card':        '#ffffff',
      '--card2':       '#f8faf8',
      '--border':      '#d4e8d4',
      '--border2':     '#b8d4b8',
      '--text':        '#1c1e21',
      '--muted':       '#4b5563',
      '--subtle':      '#9ca3af',
      '--accent':      '#006633',
      '--accent-dim':  '#008844',
      '--accent-text': '#ffffff',
    },
  },
  solarized: {
    label: 'Solarized', desc: 'Easy on the eyes',
    preview: ['#002b36', '#073642', '#2aa198'],
    vars: {
      '--bg':          '#002b36',
      '--card':        '#073642',
      '--card2':       '#0d4452',
      '--border':      '#114d5e',
      '--border2':     '#1a6070',
      '--text':        '#fdf6e3',
      '--muted':       '#93a1a1',
      '--subtle':      '#657b83',
      '--accent':      '#2aa198',
      '--accent-dim':  '#1f8076',
      '--accent-text': '#002b36',
    },
  },
}

export function applyTheme(key) {
  const theme = THEMES[key] || THEMES.dark
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v))
  localStorage.setItem('roomio-theme', key)
  // Also set body background directly for instant paint
  document.body.style.backgroundColor = theme.vars['--bg']
  document.body.style.color = theme.vars['--text']
  return theme
}

export function loadSavedTheme() {
  const key = localStorage.getItem('roomio-theme') || 'dark'
  applyTheme(key)
  return key
}

export const THEME_KEYS = Object.keys(THEMES)

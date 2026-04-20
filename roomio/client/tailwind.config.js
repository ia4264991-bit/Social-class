export default {
  content: ['./index.html','./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ucc: {
          green: '#006633',
          'green-mid': '#008844',
          'green-light': '#e6f4ec',
          'green-xlight': '#f2faf5',
          gold: '#CCA000',
          'gold-light': '#fff8e1',
        },
        dark: {
          bg:      '#0f1117',
          card:    '#161b27',
          card2:   '#1a2235',
          border:  '#1e293b',
          border2: '#243047',
          text:    '#f1f5f9',
          muted:   '#94a3b8',
          subtle:  '#475569',
        },
        brand: {
          green: '#00c853',
          'green-dim': '#00a844',
          blue:  '#3b82f6',
          gold:  '#f59e0b',
        },
      },
      fontFamily: {
        head: ['Nunito','sans-serif'],
        body: ['DM Sans','sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: '#AC5B3D',
          dark: '#93492D',
          light: '#F8F4F0',
          pale: '#FCFAF7',
        },
        caqui: {
          DEFAULT: '#DFBEA1',
          dark: '#C8A383',
          light: '#FAF3EC',
        },
        brancosol: {
          DEFAULT: '#FCFBF7',
          pure: '#FFFFFF',
          dark: '#F5F2EB',
        },
        verdeagua: {
          DEFAULT: '#A6D3C4',
          dark: '#85BEAD',
        },
        rosaclaro: {
          DEFAULT: '#F4CDD2',
          dark: '#E29FA7',
        },
        deepblack: {
          DEFAULT: '#121212',
          light: '#1E1E1E',
          card: '#242424',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Didot', 'Georgia', 'serif'],
        sans: ['Inter', 'Montserrat', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

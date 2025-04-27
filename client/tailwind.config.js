/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF4500',  // Reddit Orange
        secondary: '#1E2124', // Dark Gray
        accent: '#00A87E',   // Green
        background: '#1A1A1B', // Dark Mode Background
        surface: '#272729',   // Card Background
        text: {
          primary: '#D7DADC',
          secondary: '#818384'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  },
  plugins: [],
}

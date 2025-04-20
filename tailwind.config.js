/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        darkgray: '#343541',
        lightgray: '#444654',
        sidebar: '#202123',
        boticon: '#10a37f',
        usericon: '#5436DA',
      },
    },
  },
  plugins: [],
} 
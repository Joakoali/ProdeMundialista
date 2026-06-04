export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0A0A0A',
        surface: '#1A1A1A',
        elevated: '#242424',
        primary: '#FFFFFF',
        secondary: '#666666',
        green: '#00C896',
        red: '#FF4D4D',
        yellow: '#F5A623',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

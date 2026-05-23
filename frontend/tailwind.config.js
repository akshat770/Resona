module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
      },
      keyframes: {
        bounceIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, 30px) scale(0.8)' },
          '50%': { opacity: '1', transform: 'translate(-50%, -5px) scale(1.05)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0) scale(1)' }
        }
      }
    }
  },
  plugins: [],
};

const config = {
  plugins: ["@tailwindcss/postcss"],
theme: {
    extend: {
      colors: {
        green: {
          400: '#4ade80', // Use HEX instead of oklch
        },
        blue: {
          400: '#60a5fa', // Use HEX instead of oklch
        },
        yellow: {
          300: '#facc15', // Use HEX
          400: '#eab308', // Use HEX
        },
        red: {
          400: '#f87171', // Use HEX
        },
      },
    },
  },
};
export default config;
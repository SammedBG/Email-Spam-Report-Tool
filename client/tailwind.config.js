export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#2563eb",
          dark: "#1e40af",
        },
        accent: "#10b981",
        muted: "#6b7280",
        surface: "#0b1220",
        card: "#0f172a",
      },
      borderRadius: {
        XL: "0.875rem",
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: ["./index.html", "./src/**/*.{ts,tsx}"],
	theme: {
	  extend: {
		colors: {
		  background: "#0A0B0D",
		  foreground: "#E6EAF2",
		  muted: { DEFAULT: "#14161B", foreground: "#8B93A7" },
		  card: { DEFAULT: "#0E1014", foreground: "#E6EAF2" },
		  border: "#1B1E26",
		  brand: {
			50: "#ECFFF7",
			100: "#C6FFE9",
			200: "#90FED6",
			300: "#4DF7BF",
			400: "#1FE6A7",
			500: "#0EC08A",   // primary accent
			600: "#0D9D73",
			700: "#0E7B5D",
			800: "#0F5D49",
			900: "#0E463A"
		  },
		  court: {
			winners: "#0F1621",
			base: "#10131A"
		  }
		},
		borderRadius: {
		  xl: "1rem",
		  "2xl": "1.25rem",
		  "3xl": "1.75rem"
		},
		boxShadow: {
		  soft: "0 6px 24px rgba(0,0,0,.25)",
		  glow: "0 0 0 1px rgba(14,192,138,.15), 0 8px 24px rgba(14,192,138,.15)"
		},
		fontFamily: {
		  sans: ["Inter", "system-ui", "sans-serif"],
		  display: ["Outfit", "Inter", "system-ui", "sans-serif"]
		}
	  }
	},
	plugins: []
  };
  
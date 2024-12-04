import daisyui from "daisyui"
import typography from "@tailwindcss/typography"
import daisyuiThemes from "daisyui/src/theming/themes"

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,mjs,mts}"],
  theme: {
    extend: {},
  },
  plugins: [typography, daisyui],
  daisyui: {
    themes: [
      {
        light: {
          ...daisyuiThemes.light,
          primary: "pink",
        },
        dark: {
          ...daisyuiThemes.dark,
          primary: "pink",
        },
      },
    ],
  },
}

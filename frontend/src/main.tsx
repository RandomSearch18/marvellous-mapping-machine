import { render } from "voby"
import App from "./App"
import "leaflet/dist/leaflet.css"
import "./bottomBar.mjs"
import "./showCurrentLocation.mjs"
import "./mainMap.mjs"

const appElement = document.querySelector("#app")
if (!appElement) {
  throw new Error("No app element found")
}

console.log("main.tsx loaded")

// render(<App />, appElement)

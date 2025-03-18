import { render } from "voby"
import App from "./App"
import "leaflet/dist/leaflet.css"
import { initPyScript } from "./pyscript.mts"

// Load the service worker provided by the VitePWA plugin
// (this is only present in production)
document.addEventListener("load", () => {
  navigator.serviceWorker.register("service-worker.ts")
})

const appElement = document.querySelector("#app")
if (!appElement) {
  throw new Error("No app element found")
}

render(<App />, appElement)

// Load PyScript
initPyScript()

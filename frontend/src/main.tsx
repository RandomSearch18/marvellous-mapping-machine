import { render, useEffect } from "voby"
import App from "./App"
import "leaflet/dist/leaflet.css"
import { initPyScript, usePy } from "./pyscript.mts"

document.addEventListener("load", () => {
  navigator.serviceWorker.register("service-worker.ts")
})

const appElement = document.querySelector("#app")
if (!appElement) {
  throw new Error("No app element found")
}

render(<App />, appElement)
initPyScript()

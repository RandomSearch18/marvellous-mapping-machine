import { render } from "voby"
import App from "./App"
import "leaflet/dist/leaflet.css"
import { initPyScript } from "./pyscript.mts"

const appElement = document.querySelector("#app")
if (!appElement) {
  throw new Error("No app element found")
}

render(<App />, appElement)
initPyScript()

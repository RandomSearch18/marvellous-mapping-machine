import { render } from "voby"
import App from "./App"

const appElement = document.querySelector("#app")
if (!appElement) {
  throw new Error("No app element found")
}

console.log("main.tsx loaded")

render(<App />, appElement)
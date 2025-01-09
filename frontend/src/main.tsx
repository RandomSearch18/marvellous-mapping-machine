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

useEffect(() => {
  const py = usePy()
  if (!py) return
  const routing_engine = py.RoutingEngine()
  console.log(routing_engine)
  const [ways, raw_nodes] = routing_engine.download_osm_data(
    py.BoundingBox(51.26268, -0.41497, 51.27914, -0.36755)
  )
  const routing_graph = routing_engine.compute_graph(ways, raw_nodes)
  const calculator = py.RouteCalculator(routing_graph, py.RoutingOptions())
  const start = [51.27333, -0.39746]
  const end = [51.274179, -0.391324]
  const route = calculator.calculate_route_a_star(start, end)
  console.log("Finished calculating route")
})

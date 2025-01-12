import { useMemo } from "voby"
import { Coordinates, usePy } from "./pyscript.mts"

const routingEngineAvailable = useMemo(() => !!usePy())

function CalculateButton() {
  const tooltip = useMemo(() => {
    return ""
  })

  return (
    <div class="fixed bottom-[6rem] right-2 z-[1000]">
      <div class={() => tooltip() && "tooltip tooltip-left"} data-tip={tooltip}>
        <button
          class="btn btn-md btn-primary text-2xl font-medium"
          id="calculate-route"
          disabled={() => !routingEngineAvailable()}
          onClick={calculateRoute}
        >
          ✅ Calculate
        </button>
      </div>
    </div>
  )
}

function getCoordsFromInput(inputId: string): Coordinates | null {
  const input = document.getElementById(inputId) as HTMLInputElement
  if (!input) throw new Error(`No input found with ID ${inputId}`)
  const coords = input.value.split(",").map(parseFloat)
  if (coords.length !== 2) return null
  return coords as Coordinates
}

function calculateBboxForRoute(start: Coordinates, end: Coordinates) {
  // We expand the BBox a bit in case the route has to go away from the destination slightly before coming back
  // 0.015 degrees of longitude is roughly 1 km in the UK (I think)
  const lon_expansion = 0.015
  const LAT_DEGREES_PER_M = 0.008575
  const lat_expansion = 1000 * LAT_DEGREES_PER_M
  const min_lat = Math.min(start[0], end[0]) - lat_expansion
  const min_lon = Math.min(start[1], end[1]) - lon_expansion
  const max_lat = Math.max(start[0], end[0]) + lat_expansion
  const max_lon = Math.max(start[1], end[1]) + lon_expansion
  return [min_lat, min_lon, max_lat, max_lon] as [
    number,
    number,
    number,
    number
  ]
}

function calculateRoute() {
  const py = usePy()
  if (!py) return

  const startPos = getCoordsFromInput("route-start-input")
  const endPos = getCoordsFromInput("route-end-input")
  if (!startPos || !endPos) {
    window.alert("Please enter valid start and end coordinates")
    return
  }

  const routing_engine = py.RoutingEngine()
  console.debug("Initialised routing engine")
  const bbox = calculateBboxForRoute(startPos, endPos)
  console.debug("Using bounding box for route", bbox)
  const [ways, raw_nodes] = routing_engine.download_osm_data(
    py.BoundingBox(...bbox)
  )
  console.debug("Downloaded OSM data")
  const routing_graph = routing_engine.compute_graph(ways, raw_nodes)
  console.debug("Computed routing graph")
  const calculator = py.RouteCalculator(routing_graph, py.RoutingOptions())
  console.debug("Initialised route calculator")
  const route = calculator.calculate_route_a_star(startPos, endPos)
  console.log(route)
  console.log("Finished calculating route")
}

function RouteScreen() {
  const title = useMemo(() => "Calculate a route")

  return (
    <>
      <div class="mx-3">
        <h2 class="font-bold text-4xl mt-5 mb-8">{title}</h2>
        <form class="flex flex-col">
          <label htmlFor="route-start-input" class="text-primary">
            Start walking from
          </label>
          <input
            id="route-start-input"
            type="text"
            placeholder="e.g. 51.24914, -0.56304"
            class="input input-bordered input-primary w-full mt-2 mb-8 max-w-2xl"
          />
          <label htmlFor="route-end-input" class="text-primary">
            Destination
          </label>
          <input
            id="route-end-input"
            type="text"
            placeholder="e.g. 51.23724, -0.56456"
            class="input input-bordered input-primary w-full my-2 max-w-2xl"
          />
        </form>
      </div>
      <CalculateButton />
    </>
  )
}

export default RouteScreen

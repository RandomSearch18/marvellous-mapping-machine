import { $, If, tick, useEffect, useMemo } from "voby"
import { usePy } from "./pyscript.mts"
import { currentRoute } from "./currentRoute.mts"
import { BboxTuple, Coordinates, Line } from "./types.mts"

enum CalculationState {
  Idle,
  Downloading,
  ComputingGraph,
  CalculatingRoute,
}

const routeCalculationProgress = $<CalculationState>(CalculationState.Idle)
const routingEngineAvailable = useMemo(
  () => !!usePy() && routeCalculationProgress() === CalculationState.Idle
)

function CalculateButton() {
  const tooltip = useMemo(() => {
    if (routeCalculationProgress()) return "Route is being calculated"
    if (!routingEngineAvailable()) return "Routing engine is not ready"
    return ""
  })

  return (
    <div class="fixed bottom-[6rem] right-2 z-[1000]">
      <div class={() => tooltip() && "tooltip tooltip-left"} data-tip={tooltip}>
        <button
          class="btn btn-md btn-primary text-2xl font-medium"
          id="calculate-route"
          disabled={() => !routingEngineAvailable()}
          form="route-input"
          type="submit"
        >
          ✅ Calculate
        </button>
      </div>
    </div>
  )
}

function tickUI(): Promise<void> {
  return new Promise((resolve) => {
    tick()
    setTimeout(resolve, 1)
  })
}

function getCoordsFromInput(inputId: string): Coordinates | null {
  const input = document.getElementById(inputId) as HTMLInputElement
  if (!input) throw new Error(`No input found with ID ${inputId}`)
  const coords = input.value.split(",").map(parseFloat)
  if (coords.length !== 2) return null
  return coords as Coordinates
}

function calculateBboxForRoute(
  start: Coordinates,
  end: Coordinates,
  expansion: number
) {
  // Note: We expand the BBox a bit in case the route has to go away from the destination slightly before coming back
  // const width = Math.abs(start[1] - end[1])
  // const height = Math.abs(start[0] - end[0])
  const latExpansion = expansion * 0.02
  const lonExpansion = expansion * 0.05
  const min_lat = Math.min(start[0], end[0]) - latExpansion
  const min_lon = Math.min(start[1], end[1]) - lonExpansion
  const max_lat = Math.max(start[0], end[0]) + latExpansion
  const max_lon = Math.max(start[1], end[1]) + lonExpansion
  return [min_lat, min_lon, max_lat, max_lon] as BboxTuple
}

async function calculateRoute() {
  const py = usePy()
  if (!py) return

  const performanceStart = performance.now()
  const startPos = getCoordsFromInput("route-start-input")
  const endPos = getCoordsFromInput("route-end-input")
  if (!startPos || !endPos) {
    window.alert("Please enter valid start and end coordinates")
    return
  }

  routeCalculationProgress(CalculationState.Downloading)
  await tickUI()
  const routing_engine = py.RoutingEngine()
  const bbox = calculateBboxForRoute(startPos, endPos, 0.2)
  console.debug("Using bounding box for route", bbox)
  const [ways, raw_nodes] = routing_engine.download_osm_data(
    py.BoundingBox(...bbox)
  )
  routeCalculationProgress(CalculationState.ComputingGraph)
  await tickUI()
  const routing_graph = routing_engine.compute_graph(ways, raw_nodes)
  const calculator = py.RouteCalculator(routing_graph, py.RoutingOptions())
  routeCalculationProgress(CalculationState.CalculatingRoute)
  await tickUI()
  const route = calculator.calculate_route_a_star(startPos, endPos)
  const timeElapsed = performance.now() - performanceStart
  console.log(
    `Calculated route with ${route.parts.length} parts ` +
      `in ${timeElapsed.toLocaleString()} ms`
  )
  currentRoute({
    expandedBbox: bbox,
    unexpandedBbox: calculateBboxForRoute(startPos, endPos, 0),
    start: startPos,
    end: endPos,
    parts: route.parts,
    lines: (route.parts.toJs() as any[])
      .filter((part) => "start" in part)
      .map((part) => [part.start.toJs(), part.end.toJs()] as Line),
    totalTime: route.total_time(),
    totalDistance: route.total_distance(),
  })
  routeCalculationProgress(CalculationState.Idle)
}

useEffect(() => {
  switch (routeCalculationProgress()) {
    case CalculationState.Idle:
      console.debug("Route calculator ready")
      break
    case CalculationState.Downloading:
      console.debug("Downloading OSM data...")
      break
    case CalculationState.ComputingGraph:
      console.debug("Computing routing graph...")
      break
    case CalculationState.CalculatingRoute:
      console.debug("Calculating route...")
      break
  }
})

function RouteScreen() {
  const title = useMemo(() => "Calculate a route")

  return (
    <>
      <div class="mx-3">
        <h2 class="font-bold text-4xl mt-5 mb-8">{title}</h2>
        <form
          class="flex flex-col"
          id="route-input"
          onSubmit={(event) => {
            event.preventDefault()
            calculateRoute()
          }}
        >
          <label
            htmlFor="route-start-input"
            class="text-pink-800 dark:text-primary"
          >
            Start walking from
          </label>
          <input
            id="route-start-input"
            name="route-start"
            type="text"
            placeholder="e.g. 51.24914, -0.56304"
            class="input input-bordered input-primary w-full mt-2 mb-8 max-w-2xl border-pink-800 dark:border-primary"
          />
          <label
            htmlFor="route-end-input"
            class="text-pink-800 dark:text-primary"
          >
            Destination
          </label>
          <input
            id="route-end-input"
            name="route-end"
            type="text"
            placeholder="e.g. 51.23724, -0.56456"
            class="input input-bordered input-primary w-full my-2 max-w-2xl border-pink-800 dark:border-primary"
          />
        </form>
        <If when={() => routeCalculationProgress()}>
          <div class="mt-8 flex items-center gap-8">
            <span class="loading loading-spinner loading-lg text-primary"></span>
            <div class="h-full">
              {() => {
                switch (routeCalculationProgress()) {
                  case CalculationState.Idle:
                    console.warn("Loading spinner visible when idle")
                    return "Idle"
                  case CalculationState.Downloading:
                    return "Downloading map data (1/3)"
                  case CalculationState.ComputingGraph:
                    return "Processing map data (2/3)"
                  case CalculationState.CalculatingRoute:
                    return "Finding best route (3/3)"
                }
              }}
            </div>
          </div>
        </If>
      </div>
      <CalculateButton />
    </>
  )
}

export default RouteScreen

import { $, If, tick, useEffect, useMemo } from "voby"
import { usePy } from "./pyscript.mts"
import { currentRoute } from "./currentRoute.mts"
import { BboxTuple, Coordinates, Line, NominatimPlace } from "./types.mts"
import { ValidationError } from "./validationError.mts"

enum CalculationState {
  Idle,
  ProcessingAddresses,
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

/**
 * Parses a user-provided input that might be simple coordinates
 * - "Simple coordinates" are coordinates in the format `51.245, -0.563`
 * @param input Raw string input from text box
 * @returns A `Coordinates` pair if the input *is* simple coordinates, or `null` otherwise
 * @throws {Error} If the input is simple coordinates, but out of range
 */
function parseSimpleCoordinates(input: string): Coordinates | null {
  const simpleCoordsRegex = /^[\-\+\d\.]+,\s*[\-\+\d\.]+$/
  if (!simpleCoordsRegex.test(input)) return null
  // Validate that coordinates are within range
  const [lat, lon] = input.split(",").map(parseFloat)
  if (Math.abs(lat) > 90)
    throw new ValidationError(`Latitude (${lat}°) must be between -90° and 90°`)
  if (Math.abs(lon) > 180)
    throw new ValidationError(
      `Longitude (${lon}°) must be between -180° and 180°`
    )
  return [lat, lon]
}

async function geocodeAddress(address: string): Promise<Coordinates | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.append("q", address)
  url.searchParams.append("format", "jsonv2")
  url.searchParams.append("limit", "1")
  url.searchParams.append("countrycodes", "gb")
  const data = await fetch(url).then((response) => response.json())
  if (!data.length) return null
  const place = data[0] as NominatimPlace
  console.debug("Found place", place)
  return [parseFloat(place.lat), parseFloat(place.lon)]
}

async function getCoordsFromInput(inputId: string): Promise<Coordinates> {
  const input = document.getElementById(inputId) as HTMLInputElement
  if (!input) throw new Error(`No input found with ID ${inputId}`)
  if (!input.value) throw new ValidationError("No coordinates provided")
  const simpleCoords = parseSimpleCoordinates(input.value)
  if (simpleCoords) return simpleCoords
  const geocodedCoords = await geocodeAddress(input.value)
  if (!geocodedCoords)
    throw new ValidationError(`Couldn't find address\n${input.value}`)
  return geocodedCoords
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

async function getStartCoords(): Promise<Coordinates | null> {
  try {
    return await getCoordsFromInput("route-start-input")
  } catch (error) {
    if (error instanceof ValidationError) {
      window.alert(`Start position: ${error.message}`)
      return null
    }
    throw error
  }
}

async function getEndCoords(): Promise<Coordinates | null> {
  try {
    return await getCoordsFromInput("route-end-input")
  } catch (error) {
    if (error instanceof ValidationError) {
      window.alert(`Destination: ${error.message}`)
      return null
    }
    throw error
  }
}

async function calculateRoute() {
  const py = usePy()
  if (!py) return

  const performanceStart = performance.now()
  const startPos = await getStartCoords()
  if (!startPos) return
  const endPos = await getEndCoords()
  if (!endPos) return

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
    case CalculationState.ProcessingAddresses:
      console.debug("Processing address inputs...")
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
                  case CalculationState.ProcessingAddresses:
                    return "Processing address inputs (1/4)"
                  case CalculationState.Downloading:
                    return "Downloading map data (2/4)"
                  case CalculationState.ComputingGraph:
                    return "Processing map data (3/4)"
                  case CalculationState.CalculatingRoute:
                    return "Finding best route (4/4)"
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

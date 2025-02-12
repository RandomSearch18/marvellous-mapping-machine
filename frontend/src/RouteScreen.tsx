import { $, If, Ternary, tick, useEffect, useMemo } from "voby"
import { usePy } from "./pyscript.mts"
import { currentRoute } from "./currentRoute.mts"
import { BboxTuple, Coordinates, Line, NominatimPlace } from "./types.mts"
import { ValidationError } from "./validationError.mts"
import { throttle, CANCELLED } from "./throttle.mts"
import { options } from "./options/optionsStorage"

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

const startAtCurrentLocation = $(false)

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

const geocodeAddressThrottled = throttle(geocodeAddress, 1000)

async function geocodeAddress(address: string): Promise<NominatimPlace | null> {
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.append("q", address)
  url.searchParams.append("format", "jsonv2")
  url.searchParams.append("limit", "1")
  url.searchParams.append("countrycodes", "gb")
  const userAgentParts = ["MarvellousMappingMachine/0.3", navigator.userAgent]
  const data = await fetch(url, {
    headers: {
      "User-Agent": userAgentParts.join(" "),
    },
  }).then((response) => response.json())
  if (!data.length) return null
  const place = data[0] as NominatimPlace
  console.debug("Found place", place)
  return place
}

async function displayResolvedAddress(inputId: string) {
  const input = document.getElementById(inputId)
  if (!(input instanceof HTMLInputElement))
    throw new Error(`Input element #${inputId} not found`)
  const address = input.value
  if (!address) return alert("No address provided")
  const geocodingResponse = geocodeAddressThrottled(address)
  if (geocodingResponse === CANCELLED)
    return console.warn("Ignoring geocoding request due to throttling")
  const place = await geocodingResponse
  if (!place) return alert(`Couldn't find address: ${address}`)
  alert(
    `Address:\n${place.display_name}\n\nCoordinates: ${place.lat}, ${place.lon}`
  )
}

async function getCoordsFromInput(inputId: string): Promise<Coordinates> {
  const input = document.getElementById(inputId) as HTMLInputElement
  if (!input) throw new Error(`No input found with ID ${inputId}`)
  if (!input.value) throw new ValidationError("No input provided")
  const simpleCoords = parseSimpleCoordinates(input.value)
  if (simpleCoords) return simpleCoords
  const geocodedPlace = await geocodeAddress(input.value)
  if (!geocodedPlace)
    throw new ValidationError(`Couldn't find address\n${input.value}`)
  return [parseFloat(geocodedPlace.lat), parseFloat(geocodedPlace.lon)]
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

function getGpsLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve([position.coords.latitude, position.coords.longitude]),
      (error) => reject(error)
    )
  })
}

async function getStartCoords(): Promise<Coordinates | null> {
  if (startAtCurrentLocation()) {
    try {
      return await getGpsLocation()
    } catch (error) {
      if (!(error instanceof GeolocationPositionError)) throw error
      switch (error.code) {
        case GeolocationPositionError.POSITION_UNAVAILABLE:
          alert("Couldn't get current location: location unavailable")
          break
        case GeolocationPositionError.TIMEOUT:
          alert("Couldn't get current location: location timed out")
          break
        case GeolocationPositionError.PERMISSION_DENIED:
          alert("Couldn't let current location: permission denied")
          break
        default:
          alert("Couldn't get current location: unknown error")
      }
      console.error(`Failed to get GPS location`, error)
      return null
    }
  }

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
  const calculator = py.RouteCalculator(
    routing_graph,
    py.RoutingOptions(options.routing)
  )
  routeCalculationProgress(CalculationState.CalculatingRoute)
  await tickUI()
  const route = calculator.calculate_route_a_star(startPos, endPos)
  const timeElapsed = performance.now() - performanceStart
  console.debug("Route calculator", calculator)
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
    debug: {
      segmentWeights: calculator.segment_weights_js(),
    },
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
          class="flex flex-col gap-8  max-w-2xl"
          id="route-input"
          onSubmit={(event) => {
            event.preventDefault()
            calculateRoute()
          }}
        >
          <div class="flex flex-col gap-2">
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
              placeholder={useMemo(() =>
                startAtCurrentLocation()
                  ? "Using current GPS location"
                  : "Enter an address or coordinates"
              )}
              disabled={startAtCurrentLocation}
              class="input input-bordered input-primary w-full border-pink-800 dark:border-primary"
            />
            <button
              class="btn btn-neutral"
              type="button"
              onClick={() => displayResolvedAddress("route-start-input")}
              disabled={startAtCurrentLocation}
            >
              🔎 Check start address
            </button>
            <Ternary when={() => startAtCurrentLocation()}>
              <button
                class="btn btn-primary"
                type="button"
                onClick={() => startAtCurrentLocation(false)}
              >
                🗺️ Use address or coordinates
              </button>
              <button
                class="btn btn-primary"
                type="button"
                onClick={() => startAtCurrentLocation(true)}
              >
                📍 Use current location
              </button>
            </Ternary>
          </div>
          <div class="flex flex-col gap-2">
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
              placeholder="Enter an address or coordinates"
              class="input input-bordered input-primary w-full border-pink-800 dark:border-primary"
            />
            <button
              class="btn btn-neutral"
              type="button"
              onClick={() => displayResolvedAddress("route-end-input")}
            >
              🔎 Check destination address
            </button>
          </div>
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

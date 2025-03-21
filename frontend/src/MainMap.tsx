import type { CircleOptions, Layer, Map, PolylineOptions, Popup } from "leaflet"
import { $, $$, useEffect, useMemo } from "voby"
import { currentRoute, SegmentDebugWeight } from "./currentRoute.mts"
import { Coordinates, Line } from "./types.mts"
import { options } from "./options/optionsStorage.mts"

export const leaflet = $<typeof import("leaflet")>()
export const mainMap = $<Map>()

// We dynamically import the Leaflet library so that the UI rendering doesn't block on loading Leaflet
import("leaflet").then(({ default: leafletImport }) => {
  leaflet(leafletImport)
})

function MainMap() {
  // We initialise the map inside a useEffect() so that it only runs once the #main-map element is in the DOM
  // We _also_ use a useEffect lets us run the code once the leaflet library has been loaded
  useEffect(() => {
    const L = leaflet()
    if (!L) return
    const createdMap = L.map("main-map").setView([51.27556, -0.37834], 15)
    L.tileLayer("https://c.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`,
      maxNativeZoom: 19,
      maxZoom: 20,
    }).addTo(createdMap)
    mainMap(createdMap)
  })

  return <div id="main-map"></div>
}

let layersForCurrentRoute: (Layer | null)[] = []

const waypointCircleOptions: CircleOptions = {
  radius: 4,
  color: "#9d174d",
  opacity: 0,
  fillOpacity: 0.7,
}

const waypointLineOptions: PolylineOptions = {
  color: "#9d174d",
  opacity: 0.5,
  dashArray: "1 6",
}

useEffect(() => {
  const L = leaflet()
  const map = mainMap()
  const route = currentRoute()
  if (!L || !map || !route) return
  layersForCurrentRoute.forEach((layer) => {
    layer?.remove()
  })
  layersForCurrentRoute = [
    // Debug overlay for the extent of the downloaded data
    options.app.bboxOverlay
      ? drawBbox(route.expandedBbox, {
          color: "green",
          fillOpacity: 0.1,
          fill: false,
        })
      : null,
    // Draw debugging lines showing weights
    options.app.weightOverlay
      ? drawWeightLines(route.debug.segmentWeights)
      : null,
    // Mark start and end points with circles
    drawCircle(
      route.start,
      waypointCircleOptions,
      "Start at " + route.start.join(", ")
    ),
    drawCircle(
      route.end,
      waypointCircleOptions,
      "Destination at " + route.start.join(", ")
    ),
    // Draw line to start point
    drawStraightLine(route.start, route.lines[0][0], waypointLineOptions),
    // Draw the actual route
    drawLines(route.lines, {
      color: "#9d174d",
      opacity: 0.5,
      weight: 3,
      interactive: false,
    }),
    // Draw line to end point
    drawStraightLine(route.end, route.lines.at(-1)![1], waypointLineOptions),
  ]
})

function drawWeightLines(segments: SegmentDebugWeight[]) {
  const L = leaflet()
  const map = mainMap()
  if (!L || !map) throw new Error("Main map not initialised")
  const layer = L.layerGroup()
  const lines = segments.map((segment) => {
    const weight = segment.weight
    const hue = 360 - (weight / 10) * 360
    const color = `hsl(${hue}, 100%, 50%)`
    const line = L.polyline([segment.pos_a, segment.pos_b], {
      color,
      weight: 5,
      opacity: 0.5,
    })
    line.bindPopup(
      `Weight: ${weight.toFixed(2)} (${segment.total_weight.toFixed(2)})`
    )
    line.addEventListener("popupopen", () => {
      line.setStyle({ weight: 20 })
    })
    line.addEventListener("popupclose", () => {
      line.setStyle({ weight: 5 })
    })
    return line
  })
  lines.forEach((line) => line.addTo(layer))
  layer.addTo(map)
  return layer
}

export function drawBbox(
  bbox: [number, number, number, number],
  options: PolylineOptions
) {
  const L = leaflet()
  const map = mainMap()
  if (!L || !map) throw new Error("Main map not initialised")
  const rectangle = L.rectangle(
    [
      [bbox[0], bbox[1]],
      [bbox[2], bbox[3]],
    ],
    options
  )
  rectangle.addTo(map)
  return rectangle
}

export function drawStraightLine(
  from: Coordinates,
  to: Coordinates,
  options: PolylineOptions
) {
  const L = leaflet()
  const map = mainMap()
  if (!L || !map) throw new Error("Main map not initialised")
  const polyline = L.polyline([from, to], options)
  polyline.addTo(map)
  return polyline
}

/** Draws an array of line segments as a single polyline */
export function drawLines(lines: Line[], options: PolylineOptions) {
  const L = leaflet()
  const map = mainMap()
  if (!L || !map) throw new Error("Main map not initialised")
  // We assume that each line segment starts where the previous one ended,
  // so we can just take the first point of each line segment + the final point
  const points = lines.map((line) => line[0])
  points.push(lines.at(-1)![1])
  const polyline = L.polyline(points, options)
  polyline.addTo(map)
  return polyline
}

export function drawCircle(
  coordinates: [number, number],
  options: CircleOptions,
  popup?: string | HTMLElement | Popup
) {
  const L = leaflet()
  const map = mainMap()
  if (!L || !map) throw new Error("Main map not initialised")
  const circle = L.circle(coordinates, options)
  if (popup) circle.bindPopup(popup)
  circle.addTo(map)
  return circle
}

export default MainMap

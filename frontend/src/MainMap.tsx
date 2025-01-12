import type { Layer, Map, PolylineOptions } from "leaflet"
import { $, useEffect } from "voby"
import { currentRoute } from "./currentRoute.mts"

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
    }).addTo(createdMap)
    mainMap(createdMap)
  })

  return <div id="main-map"></div>
}

let layersForCurrentRoute: Layer[] = []

useEffect(() => {
  const L = leaflet()
  const map = mainMap()
  const route = currentRoute()
  if (!L || !map || !route) return
  layersForCurrentRoute.forEach((layer) => {
    layer.remove()
  })
  layersForCurrentRoute = [
    drawBbox(route.expandedBbox, { color: "red" }),
    drawBbox(route.unexpandedBbox, { color: "green" }),
  ]

  console.log(route.lines)
})

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

export default MainMap

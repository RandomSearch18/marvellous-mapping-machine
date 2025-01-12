import type { Map, PolylineOptions } from "leaflet"
import { $, useEffect } from "voby"

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

export function drawBbox(
  bbox: [number, number, number, number],
  options: PolylineOptions
) {
  const L = leaflet()
  const map = mainMap()
  if (!L || !map) return
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

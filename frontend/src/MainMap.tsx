import type { Map } from "leaflet"
import { $, useEffect } from "voby"

export const mainMap = $<Map>()

function MainMap() {
  // We initialise the map inside a useEffect() so that it only runs once the #main-map element is in the DOM
  useEffect(() => {
    import("leaflet").then(({ default: leaflet }) => {
      const createdMap = leaflet
        .map("main-map")
        .setView([51.27556, -0.37834], 15)
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: `&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>`,
        })
        .addTo(createdMap)
      mainMap(createdMap)
    })
  })

  return <div id="main-map"></div>
}

export default MainMap

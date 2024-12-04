import leaflet from "leaflet"
import { mainMap } from "./mainMap.mjs"

let locationMarker: leaflet.Circle | null = null
let locationCircle: leaflet.Circle | null = null

function cleanupMarkers() {
  if (locationMarker) locationMarker.remove()
  if (locationCircle) locationCircle.remove()
}

mainMap.on("locationfound", (event) => {
  cleanupMarkers()
  const radius = event.accuracy / 2
  locationMarker = leaflet
    .circle(event.latlng, {
      radius: Math.min(20, radius),
      fillOpacity: 1,
    })
    .addTo(mainMap)
  locationCircle = leaflet
    .circle(event.latlng, {
      radius,
    })
    .addTo(mainMap)
  console.debug("Location found", event)
})

mainMap.on("locationerror", (event) => {
  cleanupMarkers()
  console.error("Leaflet location error", event)
})

const showLocationButton = document.querySelector("#show-location")!
showLocationButton.addEventListener("click", () => {
  mainMap.locate({ setView: true, maxZoom: 16 })
})

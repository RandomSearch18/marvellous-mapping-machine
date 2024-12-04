import leaflet from "leaflet"
import { mainMap } from "./mainMap.mjs"

mainMap.on("locationfound", (event) => {
  const radius = event.accuracy / 2
  leaflet
    .circle(event.latlng, {
      radius: Math.min(20, radius),
      fillOpacity: 1,
    })
    .addTo(mainMap)
  leaflet
    .circle(event.latlng, {
      radius,
    })
    .addTo(mainMap)
  console.debug("Location found", event)
})

mainMap.on("locationerror", (event) => {
  console.error("Leaflet location error", event)
})

const showLocationButton = document.querySelector("#show-location")!
showLocationButton.addEventListener("click", () => {
  mainMap.locate({ setView: true, maxZoom: 16 })
})

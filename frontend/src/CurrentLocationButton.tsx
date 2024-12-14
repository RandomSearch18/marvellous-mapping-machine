import type { Circle } from "leaflet"
import { leaflet, mainMap } from "./MainMap.jsx"
import { useEffect } from "voby"

let locationMarker: Circle | null = null
let locationCircle: Circle | null = null

function cleanupMarkers() {
  if (locationMarker) locationMarker.remove()
  if (locationCircle) locationCircle.remove()
}

useEffect(() => {
  const L = leaflet()
  const map = mainMap()
  if (!map || !L) return

  map.on("locationfound", (event) => {
    cleanupMarkers()
    const radius = event.accuracy / 2
    locationMarker = L.circle(event.latlng, {
      radius: Math.min(20, radius),
      fillOpacity: 1,
    }).addTo(map)
    locationCircle = L.circle(event.latlng, {
      radius,
    }).addTo(map)
    console.debug("Location found", event)
  })

  map.on("locationerror", (event) => {
    cleanupMarkers()
    console.error("Leaflet location error", event)
  })
})

function CurrentLocationButton() {
  return (
    <div class="fixed bottom-[6rem] right-2 z-[1000]">
      <div class="tooltip tooltip-left" data-tip="Show current location">
        <button
          class="btn btn-square btn-md btn-primary text-2xl"
          id="show-location"
          disabled={() => !mainMap()}
          onClick={() => mainMap()!.locate({ setView: true, maxZoom: 16 })}
        >
          <span class="sr-only">Show current location</span>
          📍
        </button>
      </div>
    </div>
  )
}

export default CurrentLocationButton

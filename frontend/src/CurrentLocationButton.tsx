import type { Circle } from "leaflet"
import { leaflet, mainMap } from "./MainMap.jsx"
import { $, useEffect, useMemo } from "voby"

let locationMarker: Circle | null = null
let locationCircle: Circle | null = null

const trackingLocation = $(false)

/** Remove location markers currently on the map */
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
    // Draw a large circle to show GPS accuracy
    locationMarker = L.circle(event.latlng, {
      radius: Math.min(5, radius),
      fillOpacity: 0.8,
      opacity: 0.8,
    }).addTo(map)
    // Draw the dot at the center of the circle
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
  const tooltip = useMemo(() => {
    const tip = "Show current location"
    if (!mainMap()) return `${tip} (unavailable while map is loading)`
    return tip
  })

  return (
    <div class="fixed bottom-[6rem] right-2 z-[1000]">
      <div class="tooltip tooltip-left" data-tip={tooltip}>
        <button
          class="btn btn-square btn-md btn-primary text-2xl"
          id="show-location"
          disabled={() => !mainMap()}
          onClick={() => {
            const map = mainMap()
            if (!map) return console.warn("Map not ready")
            map.locate({ maxZoom: 16, watch: true })
            map.once("locationfound", () => {
              trackingLocation(true)
              // Stop tracking the location if the user manualy moves the map
              map.once("dragstart", () => {
                trackingLocation(false)
              })
            })
          }}
        >
          <span class="sr-only">Show current location</span>
          📍
        </button>
      </div>
    </div>
  )
}

export default CurrentLocationButton

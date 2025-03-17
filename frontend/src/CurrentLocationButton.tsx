import type { Circle, LatLng, Marker } from "leaflet"
import { leaflet, mainMap } from "./MainMap.jsx"
import { $, useEffect, useMemo } from "voby"

let locationMarker: Circle | null = null
let locationCircle: Circle | null = null
let locationQuestionMark: Marker | null = null

const trackingLocation = $(false)
const currentLocation = $<LatLng | null>(null)

const locationNotFoundIcon = useMemo(() => {
  return (
    leaflet()?.icon({
      iconUrl: "/bang-64.png",
      iconSize: [64, 64],
      className: "blink",
    }) ?? null
  )
})

/** Remove location markers currently on the map */
function cleanupMarkers() {
  if (locationMarker) locationMarker.remove()
  if (locationCircle) locationCircle.remove()
  if (locationQuestionMark) locationQuestionMark.remove()
}

function panToCurrentLocation() {
  const map = mainMap()
  if (!map) return
  const location = currentLocation()
  if (location) map.panTo(location)
}

useEffect(() => {
  const L = leaflet()
  const map = mainMap()
  if (!map || !L) return

  map.on("locationfound", (event) => {
    currentLocation(event.latlng)
    console.debug("Location found", event)
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
    if (trackingLocation()) panToCurrentLocation()
  })

  map.on("locationerror", (event) => {
    console.debug("Location error", event)
    // Do nothing if we haven't got a location yet
    const currentPos = currentLocation()
    if (!currentPos) return
    const icon = locationNotFoundIcon()
    if (locationQuestionMark) return // No need to add the question mark again
    locationQuestionMark = L.marker(currentPos, {
      // This should never be unavailable if Leaflet has loaded, but weirder things have been known to happen
      icon: icon ?? undefined,
    }).addTo(map)
    // Grey out the location marker
    locationMarker // TODO
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
            // Immediately pan to the last known location, and start tracking location so that it updates when new location data is available
            trackingLocation(true)
            panToCurrentLocation()
            map.locate({ maxZoom: 16, watch: true })
            map.once("locationfound", () => {
              // Stop tracking the location if the user manually moves the map
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

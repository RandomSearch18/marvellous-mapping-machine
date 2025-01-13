import { useEffect, useMemo } from "voby"
import { CurrentRoute, currentRoute } from "./currentRoute.mts"
import { displayInteger, timestampNow } from "./localization.mts"

function ClearRouteButton() {
  return (
    <div class="fixed bottom-[6rem] right-2 z-[1000]">
      <div>
        <button
          class="btn btn-md btn-primary text-2xl font-medium"
          type="button"
          onClick={() => {
            currentRoute(undefined)
          }}
        >
          🗑️ Clear route
        </button>
      </div>
    </div>
  )
}

function RouteInfoScreen({ route }: { route: CurrentRoute }) {
  const meters = displayInteger(route.totalDistance)
  const minutes = displayInteger(route.totalTime / 60)
  const ETA = useMemo(() => new Date(timestampNow() + route.totalTime * 1000))

  return (
    <>
      <div class="mx-3">
        <h2 class="font-bold text-4xl mt-5 mb-8">Route info</h2>
        <div class="flex flex-col gap-4">
          <p>📍 Walking from {route.start}</p>
          <p>📌 Walking to {route.end}</p>
          <p>
            🪜{meters} metres, {minutes} minutes remaining
            <br />⌚ Estimated to arrive at{" "}
            {() =>
              ETA().toLocaleTimeString(undefined, {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            }
          </p>
        </div>
      </div>
      <ClearRouteButton />
    </>
  )
}

export default RouteInfoScreen

import { currentRoute } from "./currentRoute.mts"

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

function RouteInfoScreen() {
  return (
    <>
      <div class="mx-3">
        <h2 class="font-bold text-4xl mt-5 mb-8">Route info</h2>
      </div>
      <ClearRouteButton />
    </>
  )
}

export default RouteInfoScreen

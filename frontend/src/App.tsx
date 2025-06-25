import { useMemo } from "voby"
import BottomBar from "./BottomBar"
import CurrentLocationButton from "./CurrentLocationButton"
import MainMap from "./MainMap"
import RouteScreen from "./RouteScreen"
import { currentRoute } from "./currentRoute.mts"
import RouteInfoScreen from "./RouteInfoScreen"
import OptionsScreen from "./options/OptionsScreen"

function App() {
  return (
    <>
      <h1 class="sr-only">Marvellous mapping machine</h1>
      <div class="content flex flex-col h-full justify-between">
        <div id="screens" class="overflow-y-auto">
          <div class="screen" data-screen="map" id="active-screen">
            <MainMap />
            {() => <CurrentLocationButton />}
          </div>
          <div class="screen" data-screen="route">
            {useMemo(() => {
              const route = currentRoute()
              return route ? <RouteInfoScreen route={route} /> : <RouteScreen />
            })}
          </div>
          <div class="screen" data-screen="options">
            <OptionsScreen />
          </div>
          <div class="screen" data-screen="reels">
            <div class="mx-3">
              <h2 class="font-bold text-4xl mt-5 mb-8">Reels</h2>
              <p class="mb-8">
                Bored of nature? Download reels here so that you can watch them
                offline.
              </p>
              <a
                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                target="_blank"
                class="btn btn-primary"
              >
                Browse Reels
              </a>
            </div>
          </div>
        </div>
        <BottomBar />
      </div>
    </>
  )
}

export default App

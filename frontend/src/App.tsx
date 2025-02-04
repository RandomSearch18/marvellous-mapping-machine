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
      <div class="content">
        <div id="screens">
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
        </div>
        <BottomBar />
      </div>
    </>
  )
}

export default App

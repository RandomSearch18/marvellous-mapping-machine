import BottomBar from "./BottomBar"
import CurrentLocationButton from "./CurrentLocationButton"
import MainMap from "./MainMap"
import RouteScreen from "./RouteScreen"

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
            <RouteScreen />
          </div>
          <div class="screen" data-screen="options">
            Options screen!
          </div>
        </div>
        <BottomBar />
      </div>
    </>
  )
}

export default App

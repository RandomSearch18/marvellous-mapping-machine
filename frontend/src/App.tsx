import BottomBar from "./BottomBar"
import CurrentLocationButton from "./CurrentLocationButton"
import MainMap from "./MainMap"

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
            Route screen!
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

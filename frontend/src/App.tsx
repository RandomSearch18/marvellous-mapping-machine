import BottomBar from "./BottomBar"

function App() {
  return (
    <>
      <h1 class="sr-only">Marvellous mapping machine</h1>
      <div class="content">
        <div id="screens">
          <div class="screen" data-screen="map" id="active-screen">
            <div id="main-map"></div>
            <div class="fixed bottom-[6rem] right-2 z-[1000]">
              <div
                class="tooltip tooltip-left"
                data-tip="Show current location"
              >
                <button
                  class="btn btn-square btn-md btn-primary text-2xl"
                  id="show-location"
                >
                  <span class="sr-only">Show current location</span>
                  📍
                </button>
              </div>
            </div>
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

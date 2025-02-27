import { clearData } from "./optionsStorage.mts"

function DebugButtons() {
  return (
    <div class="flex gap-4 mt-4 flex-wrap">
      {/* <button class="btn btn-primary">Clear stored data</button> */}
      <div class="tooltip" data-tip="Reset options to defaults">
        <button
          class="btn"
          onClick={() => {
            const consent = confirm(
              "Warning: All stored data will be deleted. This cannot be undone, irreversible, etc etc."
            )
            if (!consent) return
            clearData()
          }}
        >
          Clear stored data
        </button>
      </div>
      <div
        class="tooltip"
        data-tip="Re-downloads the latest version of the app, map data, and map tiles. This will use a lot of data."
      >
        <button class="btn">Clear cache and reload</button>
      </div>
    </div>
  )
}

export default DebugButtons

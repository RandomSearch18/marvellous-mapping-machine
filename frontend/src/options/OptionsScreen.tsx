import OptionLine from "./OptionLine"
import { optionsStore } from "./optionsStorage"

function OptionsScreen() {
  return (
    <div class="mx-3">
      <h2 class="font-bold text-4xl mt-5 mb-8">Navigation options</h2>
      <div class="flex flex-col max-w-2xl">
        <h3 class="font-bold text-2xl mb-4">Debug</h3>
        <OptionLine
          label="Show weight overlay"
          input={
            <input
              type="checkbox"
              checked={optionsStore.app.weightOverlay}
              class="checkbox checkbox-primary"
              onClick={(event) => {
                if (!(event.target instanceof HTMLInputElement)) return
                optionsStore.app.weightOverlay = event.target.checked
              }}
            />
          }
        />
        <OptionLine
          label="More options coming soon"
          input={
            <input
              type="checkbox"
              checked={true}
              class="checkbox checkbox-primary"
            />
          }
        />
      </div>
    </div>
  )
}

export default OptionsScreen

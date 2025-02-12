import AvoidNeutralPreferLine from "./AvoidNeutralPreferLine"
import CheckboxLine from "./CheckboxLine"
import { options } from "./optionsStorage"

function OptionsScreen() {
  return (
    <div class="mx-3">
      <h2 class="font-bold text-4xl mt-5 mb-8">Navigation options</h2>
      <div class="flex flex-col max-w-xl mb-8">
        <h3 class="font-bold text-2xl mb-4">Debug</h3>
        <CheckboxLine
          label="Show weight overlay"
          input={
            <input
              type="checkbox"
              checked={options.app.weightOverlay}
              class="checkbox checkbox-primary"
              onClick={(event) => {
                if (!(event.target instanceof HTMLInputElement)) return
                options.app.weightOverlay = event.target.checked
              }}
            />
          }
        />
        <CheckboxLine
          label="Show bounding boxes for downloaded data"
          input={
            <input
              type="checkbox"
              checked={options.app.bboxOverlay}
              class="checkbox checkbox-primary"
              onClick={(event) => {
                if (!(event.target instanceof HTMLInputElement)) return
                options.app.bboxOverlay = event.target.checked
              }}
            />
          }
        />
      </div>
      <div class="flex flex-col max-w-xl  mb-8">
        <h3 class="font-bold text-2xl mb-4">Path types</h3>
        <AvoidNeutralPreferLine label="Unpaved paths" key="unpaved_paths" />
        <AvoidNeutralPreferLine label="Paved paths" key="paved_paths" />
        <AvoidNeutralPreferLine label="Covered paths" key="covered_paths" />
        <AvoidNeutralPreferLine label="Indoor paths" key="indoor_paths" />
        <AvoidNeutralPreferLine label="💡 Lit paths" key="lit_paths" />
        <AvoidNeutralPreferLine label="Pavements" key="pavements" />
        <AvoidNeutralPreferLine label="Steps/staircases" key="steps" />
      </div>
    </div>
  )
}

export default OptionsScreen

import AvoidNeutralPreferLine from "./AvoidNeutralPreferLine"
import CheckboxLine from "./CheckboxLine"
import OptionsSection from "./OptionsSection"
import { options } from "./optionsStorage.mts"
import PreferPreferMoreLine from "./PreferPreferMoreLine"

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
      <OptionsSection title="Path types">
        <AvoidNeutralPreferLine label="Unpaved paths" key="unpaved_paths" />
        <AvoidNeutralPreferLine label="Paved paths" key="paved_paths" />
        <AvoidNeutralPreferLine label="Covered paths" key="covered_paths" />
        <AvoidNeutralPreferLine label="Indoor paths" key="indoor_paths" />
        <AvoidNeutralPreferLine label="💡 Lit paths" key="lit_paths" />
        <AvoidNeutralPreferLine label="Pavements" key="pavements" />
        <AvoidNeutralPreferLine label="Steps/staircases" key="steps" />
      </OptionsSection>
      <OptionsSection title="Crossings">
        <PreferPreferMoreLine
          label="Marked crossings"
          key="prefer_marked_crossings"
        />
        <PreferPreferMoreLine
          label="Traffic light crossings"
          key="prefer_traffic_light_crossings"
        />
        <PreferPreferMoreLine label="Dipped kerbs" key="prefer_dipped_kerbs" />
        <PreferPreferMoreLine
          label="Tactile paving"
          key="prefer_tactile_paving"
        />
      </OptionsSection>
      <OptionsSection title="Access">
        <PreferPreferMoreLine
          label="Private access"
          key="allow_private_access"
        />
        <PreferPreferMoreLine
          label="Customer access"
          key="allow_customer_access"
        />
      </OptionsSection>
      <OptionsSection title="Safety">
        <PreferPreferMoreLine
          label="Walking on roads"
          key="allow_walking_on_roads"
        />
        <PreferPreferMoreLine
          label="Higher traffic roads"
          key="allow_higher_traffic_roads"
        />
      </OptionsSection>
    </div>
  )
}

export default OptionsScreen

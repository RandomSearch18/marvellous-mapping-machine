import { useMemo } from "voby"
import { options, setRoutingOption } from "./optionsStorage"
import { RoutingOptionsOptions } from "../pyscript.mts"
import OptionLine from "./OptionLine"

function AvoidNeutralPreferLine({
  label,
  key,
}: {
  label: JSX.Child
  key: keyof RoutingOptionsOptions
}) {
  const inputClasses = ["btn", "btn-outline", "join-item"]
  const selectedInputClasses = ["btn-inset"]
  const state = useMemo(() => {
    const routingOptions = options.routing
    return routingOptions[key]
  })
  const input = (
    <div class="flex join rounded-full">
      <button
        class={() => [
          ...inputClasses,
          state() === -1 ? selectedInputClasses : null,
          "btn-error",
        ]}
        onClick={() => setRoutingOption(key, -1)}
      >
        Avoid
      </button>
      <button
        class={() => [
          ...inputClasses,
          state() === 0 ? selectedInputClasses : null,
          "btn-neutral",
        ]}
        onClick={() => setRoutingOption(key, 0)}
      >
        Neutral
      </button>
      <button
        class={() => [
          ...inputClasses,
          state() === 1 ? selectedInputClasses : null,
          "btn-success",
        ]}
        onClick={() => setRoutingOption(key, 1)}
      >
        Prefer
      </button>
    </div>
  )
  return <OptionLine input={input} label={label} />
}

export default AvoidNeutralPreferLine

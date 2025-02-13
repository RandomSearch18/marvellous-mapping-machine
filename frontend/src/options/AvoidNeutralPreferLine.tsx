import { useMemo } from "voby"
import { options } from "./optionsStorage"
import { RoutingOptionsOptions } from "../pyscript.mts"
import OptionLine from "./OptionLine"

function setOption<T extends keyof RoutingOptionsOptions>(
  key: T,
  value: RoutingOptionsOptions[T]
) {
  if (!(key in options.routing)) {
    throw new Error(`Option doesn't exist: ${key}`)
  }
  const existingType = typeof options.routing[key]
  const ourType = typeof value
  if (existingType !== ourType) {
    throw new Error(
      `Incompatible option types: can't assign ${ourType} to ${existingType}`
    )
  }
  options.routing[key] = value
}

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
        onClick={() => setOption(key, -1)}
      >
        Avoid
      </button>
      <button
        class={() => [
          ...inputClasses,
          state() === 0 ? selectedInputClasses : null,
          "btn-neutral",
        ]}
        onClick={() => setOption(key, 0)}
      >
        Neutral
      </button>
      <button
        class={() => [
          ...inputClasses,
          state() === 1 ? selectedInputClasses : null,
          "btn-success",
        ]}
        onClick={() => setOption(key, 1)}
      >
        Prefer
      </button>
    </div>
  )
  return <OptionLine input={input} label={label} />
}

export default AvoidNeutralPreferLine

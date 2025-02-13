import { useMemo } from "voby"
import { options, setRoutingOption } from "./optionsStorage.mts"
import { RoutingOptionsOptions } from "../pyscript.mts"
import OptionLine from "./OptionLine"
import CombiButtonButton from "./CombiButtonButton"

function AvoidNeutralPreferLine({
  label,
  key,
}: {
  label: JSX.Child
  key: keyof RoutingOptionsOptions
}) {
  const state = useMemo(() => {
    const routingOptions = options.routing
    return routingOptions[key]
  })
  const input = (
    <div class="flex join rounded-full">
      <CombiButtonButton
        active={() => state() === -1}
        onClick={() => setRoutingOption(key, -1)}
        classes="btn-error"
      >
        Avoid
      </CombiButtonButton>

      <CombiButtonButton
        active={() => state() === 0}
        onClick={() => setRoutingOption(key, 0)}
        classes="btn-neutral"
      >
        Neutral
      </CombiButtonButton>

      <CombiButtonButton
        active={() => state() === 1}
        onClick={() => setRoutingOption(key, 1)}
        classes="btn-success"
      >
        Prefer
      </CombiButtonButton>
    </div>
  )
  return <OptionLine input={input} label={label} />
}

export default AvoidNeutralPreferLine

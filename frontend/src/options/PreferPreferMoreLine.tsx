import { useMemo } from "voby"
import { options, setRoutingOption } from "./optionsStorage.mts"
import { RoutingOptionsOptions } from "../pyscript.mts"
import OptionLine from "./OptionLine"
import CombiButtonButton from "./CombiButtonButton"

function PreferPreferMoreLine({
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
        active={() => state() === false}
        onClick={() => setRoutingOption(key, false)}
        classes="btn-neutral"
      >
        Prefer
      </CombiButtonButton>
      <CombiButtonButton
        active={() => state() === true}
        onClick={() => setRoutingOption(key, true)}
        classes="btn-success"
      >
        Prefer more
      </CombiButtonButton>
    </div>
  )
  return <OptionLine input={input} label={label} />
}

export default PreferPreferMoreLine

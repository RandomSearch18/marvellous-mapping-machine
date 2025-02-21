import { useMemo } from "voby"
import { options, setRoutingOption } from "./optionsStorage.mts"
import { RoutingOptions } from "../pyscript.mts"
import OptionLine from "./OptionLine"
import CombiButtonButton from "./CombiButtonButton"

function BooleanOptionLine({
  label,
  key,
  buttons,
}: {
  label: JSX.Child
  key: keyof RoutingOptions
  buttons: {
    false: {
      text: string
      classes: JSX.Class
    }
    true: {
      text: string
      classes: JSX.Class
    }
  }
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
        classes={buttons.false.classes}
      >
        {buttons.false.text}
      </CombiButtonButton>
      <CombiButtonButton
        active={() => state() === true}
        onClick={() => setRoutingOption(key, true)}
        classes={buttons.true.classes}
      >
        {buttons.true.text}
      </CombiButtonButton>
    </div>
  )
  return <OptionLine input={input} label={label} />
}

export default BooleanOptionLine

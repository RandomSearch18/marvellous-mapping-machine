import { RoutingOptionsOptions } from "../pyscript.mts"
import BooleanOptionLine from "./BooleanOptionLine"

export function PreferPreferMoreLine({
  label,
  key,
}: {
  label: JSX.Child
  key: keyof RoutingOptionsOptions
}) {
  return BooleanOptionLine({
    label,
    key,
    buttons: {
      false: {
        text: "Prefer",
        classes: "btn-neutral",
      },
      true: {
        text: "Prefer more",
        classes: "btn-success",
      },
    },
  })
}

export function DisallowAllowLine({
  label,
  key,
}: {
  label: JSX.Child
  key: keyof RoutingOptionsOptions
}) {
  return BooleanOptionLine({
    label,
    key,
    buttons: {
      false: {
        text: "Disallow",
        classes: "btn-error",
      },
      true: {
        text: "Allow",
        classes: "btn-neutral",
      },
    },
  })
}

export function NeverReduceLine({
  label,
  key,
}: {
  label: JSX.Child
  key: keyof RoutingOptionsOptions
}) {
  return BooleanOptionLine({
    label,
    key,
    buttons: {
      false: {
        text: "Never",
        classes: "btn-error",
      },
      true: {
        text: "Reduce",
        classes: "btn-neutral",
      },
    },
  })
}

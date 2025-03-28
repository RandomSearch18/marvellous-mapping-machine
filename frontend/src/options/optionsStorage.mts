import { store, useEffect } from "voby"
import { RoutingOptions, TriStateOption } from "../pyscript.mts"

const LOCAL_STORAGE_KEY = "options"

export type Options = {
  /** Frontend-only options */
  app: {
    weightOverlay: boolean
    bboxOverlay: boolean
  }
  /** Options to be passed to the Python routing engine */
  routing: RoutingOptions
}

const defaultOptions: Options = {
  app: {
    weightOverlay: false,
    bboxOverlay: false,
  },
  routing: {
    unpaved_paths: TriStateOption.Neutral,
    paved_paths: TriStateOption.Neutral,
    covered_paths: TriStateOption.Prefer,
    indoor_paths: TriStateOption.Neutral,
    lit_paths: TriStateOption.Neutral,
    pavements: TriStateOption.Neutral,
    steps: TriStateOption.Neutral,
    prefer_marked_crossings: false,
    prefer_traffic_light_crossings: false,
    prefer_audible_crossings: false, // TODO add to UI
    prefer_dipped_kerbs: false,
    prefer_tactile_paving: false,
    allow_private_access: false,
    allow_customer_access: true,
    allow_walking_on_roads: true,
    allow_higher_traffic_roads: true,
    rights_of_way: TriStateOption.Prefer,
    maintained_paths: TriStateOption.Prefer,
    desire_paths: TriStateOption.Neutral,
    treacherous_paths: TriStateOption.Avoid,
    wheelchair_accessible: false,
  },
}

function getInitialOptions(): Options {
  const rawData = localStorage.getItem(LOCAL_STORAGE_KEY)
  const stored: {
    app?: Partial<Options["app"]>
    routing?: Partial<Options["routing"]>
  } = rawData ? JSON.parse(rawData) : null
  try {
    return {
      app: {
        ...defaultOptions.app,
        ...stored?.app,
      },
      routing: {
        ...defaultOptions.routing,
        ...stored?.routing,
      },
    }
  } catch (error) {
    console.error("Failed to parse options from local storage:", error)
    return defaultOptions
  }
}

export const options = store<Options>(getInitialOptions())

export function clearData() {
  localStorage.removeItem(LOCAL_STORAGE_KEY)
  store.reconcile(options, defaultOptions)
  console.debug("Cleared stored options")
}

useEffect(() => {
  const serializedOptions = JSON.stringify(options)
  localStorage.setItem(LOCAL_STORAGE_KEY, serializedOptions)
  console.debug("Updated saved options:", serializedOptions)
})

export function setRoutingOption<T extends keyof RoutingOptions>(
  key: T,
  value: RoutingOptions[T]
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

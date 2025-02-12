import { store, useEffect } from "voby"
import { RoutingOptionsOptions, TriStateOption } from "../pyscript.mts"

export type Options = {
  /** Frontend-only options */
  app: {
    weightOverlay: boolean
    bboxOverlay: boolean
  }
  /** Options to be passed to the Python routing engine */
  routing: RoutingOptionsOptions
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
    steps: TriStateOption.Neutral,
    prefer_marked_crossings: false,
    prefer_traffic_light_crossings: false,
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
  const stored = localStorage.getItem("options")
  if (!stored) return defaultOptions
  try {
    return JSON.parse(stored)
  } catch (error) {
    console.error("Failed to parse options from local storage:", error)
    return defaultOptions
  }
}

export const options = store<Options>(getInitialOptions())

useEffect(() => {
  const serializedOptions = JSON.stringify(options)
  localStorage.setItem("options", serializedOptions)
  console.debug("Updated saved options:", serializedOptions)
})

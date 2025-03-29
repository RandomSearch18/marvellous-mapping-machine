/**
 * @file Hand-written TypeScript types for some of the functions exposed by the PyScript code (for better DX)
 */

import { $ } from "voby"

/** An "Avoid", "Neutral" or "Prefer" option value */
export const enum TriStateOption {
  Avoid = -1,
  Neutral = 0,
  Prefer = 1,
}

export type RoutingOptions = {
  unpaved_paths: TriStateOption
  paved_paths: TriStateOption
  covered_paths: TriStateOption
  indoor_paths: TriStateOption
  lit_paths: TriStateOption
  pavements: TriStateOption
  steps: TriStateOption
  prefer_marked_crossings: boolean
  prefer_traffic_light_crossings: boolean
  prefer_audible_crossings: boolean
  prefer_dipped_kerbs: boolean
  prefer_tactile_paving: boolean
  allow_private_access: boolean
  allow_customer_access: boolean
  allow_walking_on_roads: boolean
  allow_higher_traffic_roads: boolean
  rights_of_way: TriStateOption
  maintained_paths: TriStateOption
  desire_paths: TriStateOption
  treacherous_paths: TriStateOption
  wheelchair_accessible: boolean
}

/** The Python constructor functions exported to `window.py` */
export interface WindowPy {
  BoundingBox: (
    min_lat: number,
    min_lon: number,
    max_lat: number,
    max_lon: number
  ) => any
  RouteCalculator: (routing_graph: any, routing_options: any) => any
  RoutingEngine: () => any
  RoutingOptions: (options: RoutingOptions) => any
}

export const usePy = $<WindowPy>()

/** Imports the PyScript module, which automatically downloads and runs the app's Python code */
export async function initPyScript() {
  const pyscriptImport = await import(
    // @ts-ignore - No types for PyScript :(
    "../node_modules/@pyscript/core/dist/core.js"
  )

  window.addEventListener("py:done", () => {
    // @ts-ignore ("trust me bro" type safety guarantee)
    usePy(window.py)
  })

  console.debug("PyScript downloaded", pyscriptImport)
}

import { $ } from "voby"

export const enum TriStateOption {
  Avoid = -1,
  Neutral = 0,
  Prefer = 1,
}

export type RoutingOptionsOptions = {
  unpaved_paths: TriStateOption
  paved_paths: TriStateOption
  covered_paths: TriStateOption
  indoor_paths: TriStateOption
  steps: TriStateOption
  prefer_marked_crossings: boolean
  prefer_traffic_light_crossings: boolean
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

export interface WindowPy {
  BoundingBox: (
    min_lat: number,
    min_lon: number,
    max_lat: number,
    max_lon: number
  ) => any
  RouteCalculator: (routing_graph: any, routing_options: any) => any
  RoutingEngine: () => any
  RoutingOptions: (options: RoutingOptionsOptions) => any
}

export const usePy = $<WindowPy>()

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

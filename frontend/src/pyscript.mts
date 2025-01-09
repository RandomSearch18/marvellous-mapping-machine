import { $ } from "voby"

export type Coordinates = [number, number]

export interface WindowPy {
  BoundingBox: (
    min_lat: number,
    min_lon: number,
    max_lat: number,
    max_lon: number
  ) => any
  RouteCalculator: (routing_graph: any, routing_options: any) => any
  RoutingEngine: () => any
  RoutingOptions: () => any
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

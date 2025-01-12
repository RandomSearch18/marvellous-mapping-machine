import { $ } from "voby"
import { BboxTuple } from "./types.mts"

export const currentRoute = $<CurrentRoute>()

export interface CurrentRoute {
  unexpandedBbox: BboxTuple
  expandedBbox: BboxTuple
}

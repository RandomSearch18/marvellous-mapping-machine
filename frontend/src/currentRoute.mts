import { $, useEffect } from "voby"
import { BboxTuple, Coordinates, Line } from "./types.mts"

export const currentRoute = $<CurrentRoute>()

useEffect(() => {
  console.log("Current route:", currentRoute())
})
console.log("USED effect")

export interface RoutePart {
  distance: number
  estimated_time: number
  description(): string
}

export interface CurrentRoute {
  unexpandedBbox: BboxTuple
  expandedBbox: BboxTuple
  start: Coordinates
  end: Coordinates
  parts: RoutePart[]
  lines: Line[]
  totalTime: number
  totalDistance: number
}

import { $, useEffect } from "voby"
import { BboxTuple, Coordinates, Line } from "./types.mts"

export const currentRoute = $<CurrentRoute>()

useEffect(() => {
  console.debug("Current route:", currentRoute())
})

export interface RoutePart {
  distance: number
  estimated_time: number
  description(): string
}

export interface SegmentDebugWeight {
  pos_a: Coordinates
  pos_b: Coordinates
  weight: number
  total_weight: number
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
  debug: {
    segmentWeights: SegmentDebugWeight[]
  }
}

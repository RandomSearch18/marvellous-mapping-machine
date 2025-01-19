export type BboxTuple = [number, number, number, number]
export type Coordinates = [number, number]
export type Line = [Coordinates, Coordinates]

export interface NominatimPlace {
  place_id: number
  licence: string
  osm_type: string
  osm_id: string
  boundingbox: string[]
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
  icon: string
}

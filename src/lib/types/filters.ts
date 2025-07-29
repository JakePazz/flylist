import type { TairportCategory } from "./airportCategory"

export type TflightFilters = {
  airports: {
    category: TairportCategory,
    icaos: string[],
  },
  durationMins: {
    min: number,
    max: number
  },
  aircraftIds: number[],
  airlineIcaos: string[]
}

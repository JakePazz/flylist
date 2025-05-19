import type { Taircraft } from "./aircraft";
import type { Tairline } from "./airline";
import type { Tairport } from "./airport";

export type Tflight = {
  id: number,
  route: {
    dep_airport: string,
    arr_airport: string,
  },
  complete_route?: {
    dep_airport: Tairport, // Full departure airport details
    arr_airport: Tairport, // Full arrival airport details
  },
  company: {
    fl_no: string,
    callsign: string,
    airline_icao: string,
    airline?: Tairline,
  },
  aircraft: Taircraft,
  duration: number, // Minutes
  archived: boolean,
  last_edited: Date,
  created_at: Date,
}
import type { Tflight } from "$lib/types/flight"
import { open } from '@tauri-apps/plugin-shell';

/**
 * Open a provided flight in simbrief using all revelant values within object to auto-fill fields
 * @param flight
 */
export function openInSimbrief(flight: Tflight) {
  const url = `https://dispatch.simbrief.com/options/custom`
  const params: { key: string, value: string }[] = []

  console.info(`Opening flight (id: ${flight.id}) in simbrief`)

  if (flight?.company.airline_icao) {
    params.push(
      {
        key: "airline",
        value: flight.company.airline_icao
      },
      {
        key: "fltnum",
        value: flight?.company.fl_no
      },
      {
        key: "callsign",
        value: flight.company.callsign
      }
    )
  }

  if (flight?.route) {
    params.push(
      {
        key: "orig",
        value: flight.route.dep_airport
      },
      {
        key: "dest",
        value: flight.route.arr_airport,
      }
    )
  }

  if (flight?.aircraft) {
    params.push(
      {
        key: "type",
        value: flight?.aircraft.icao_code
      }
    )
  }

  const paramsFlattened: string[] = params.map((param) => {

    return `${param.key}=${param.value}`
  })!!

  open(`${url}?${paramsFlattened.join("&")}`)
}
import { FlyListDB } from "$lib/managers/database"
import { getToast } from "$lib/stores/toast.svelte"
import { open } from '@tauri-apps/plugin-shell';

/**
 * Opens provided flight number on FlightRadar24 if iata code avaible in DB for provided airline icao
 * @param airlineIcao
 * @param flightNumber
 */
export async function openFlightradar(airlineIcao: string, flightNumber: string) {
  const airline = await FlyListDB.getAirline(airlineIcao)

  const toast = getToast()

  if (!airline) {
    toast.addToast({
      title: "Not available for this flight",
      type: "info"
    })
  }
  
  const baseUrl = "https://www.flightradar24.com/data/flights"
  const url = `${baseUrl}/${airline.iata}${flightNumber}`
  open(url)
}
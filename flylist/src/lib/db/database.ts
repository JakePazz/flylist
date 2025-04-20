import Database from "@tauri-apps/plugin-sql";
import type { Tflight } from "../types/flight";
import { P } from "flowbite-svelte";

export class FlightDB {

  static async createFlight(data: Tflight): Promise<string> {
    console.log(this.createFlight)

    try {
      const db = await Database.load("sqlite:flylist.db")

      await db.execute("INSERT INTO flights (dep_airport, arr_airport, flight_num, callsign, ac_type, duration) VALUES ($1, $2, $3, $4, $5, $6)", [
        data.route.dep_airport,
        data.route.arr_airport,
        data.company.fl_no,
        data.company.callsign,
        data.ac_type,
        data.duration
      ])

      await db.close()
      return "success"
    } catch (error) {
      throw new Error(`Error when creating flight: ${error}`)
    }
  }

  static async readFlight(): Promise<Tflight[]> {

    try {
      const db = await Database.load("sqlite:flylist.db")

      type TdbFlight = {
        id: number,
        dep_airport: string,
        arr_airport: string,
        flight_num: string,
        callsign: string,
        ac_type: string,
        duration: number,
        archived: boolean,
        created_at: Date,
        last_edited: Date,
      }

      const dbFlights = await db.select<TdbFlight[]>("SELECT * FROM flights")

      const flights: Tflight[] = dbFlights.map((flight) => {
        return {
          id: flight.id,
          ac_type: flight.ac_type,
          company: {
            callsign: flight.callsign,
            fl_no: flight.flight_num,
          },
          duration: flight.duration,
          route: {
            arr_airport: flight.arr_airport,
            dep_airport: flight.dep_airport,
          },
          created_at: flight.created_at,
          last_edited: flight.last_edited,
          archived: flight.archived,
        }
      })

      await db.close()
      return flights
    } catch (error) {
      throw new Error(`Error when reading flight(s): ${error}`)
    }

  }

}
import Database from "@tauri-apps/plugin-sql";
import type { Tflight } from "../types/flight";

type TdbFlight = {
  id: number,
  dep_airport: string,
  arr_airport: string,
  flight_num: string,
  callsign: string,
  ac_type: string,
  duration: number,
  archived: number,
  created_at: Date,
  last_edited: Date,
}

export class FlyListDB {
  

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
          archived: flight.archived == 1 ? true : false, // Converts from 0 | 1 to boolean
        }
      })

      await db.close()
      return flights
    } catch (error) {
      throw new Error(`Error when reading flight(s): ${error}`)
    }
  }

  static async deleteFlight(flight: Tflight): Promise<boolean> {
    try {
      const db = await Database.load("sqlite:flylist.db")

      await db.execute("DELETE FROM flights WHERE id = $1", [flight.id])

      await db.close()
      return true
    } catch (error) {
      throw new Error(`Error when deleting flight with id of '${flight.id}': ${error}`)
    }
  }

  static async toggleArchiveFlight(flight: Tflight): Promise<boolean> {
    try {
      const db = await Database.load("sqlite:flylist.db")

      await db.execute(`UPDATE flights SET archived = ${flight.archived === true ? "0" : "1"} WHERE id = $1`, [flight.id])

      await db.close()
      return true
    } catch (error) {
      throw new Error(`Error when archiving flight with id of '${flight.id}': ${error}`)
    }
  }

  static async editFlight(flight: Tflight, updatedFlight: Tflight): Promise<boolean> {
    try {
      const db = await Database.load("sqlite:flylist.db")

      // Convert flight and updatedFlight to TdbFlight type
      const DbFlight: TdbFlight = this.toDbFlight(flight)
      const DbUpdatedFlight: TdbFlight = this.toDbFlight(updatedFlight)

      // Build the SET clause
      const updates: string[] = []
      const values: any[] = []
      let index = 1

      for (const key in DbUpdatedFlight) {
        if (DbUpdatedFlight[key as keyof TdbFlight] !== DbFlight[key as keyof TdbFlight]) {
          updates.push(`${key} = $${index}`)
          values.push(DbUpdatedFlight[key as keyof TdbFlight])
          index++
        }
      }

      if (updates.length === 0) return false

      // Add the flight ID to the values array for the WHERE clause
      values.push(flight.id)

      const query = `UPDATE flights SET ${updates.join(", ")} WHERE id = $${index}`
      await db.execute(query, values);

      await db.close()
      return true
    } catch (error) {
      console.log("DB Error")
      console.log(error)
      throw new Error(`Error when archiving flight with id of '${updatedFlight.id}': ${error}`)
    }
  }

  private static toDbFlight(flight: Tflight): TdbFlight {
    return {
      ac_type: flight.ac_type,
      archived: flight.archived ? 1 : 0,
      arr_airport: flight.route.arr_airport,
      dep_airport: flight.route.dep_airport,
      callsign: flight.company.callsign,
      created_at: flight.created_at,
      duration: flight.duration,
      flight_num: flight.company.fl_no,
      id: flight.id,
      last_edited: flight.last_edited,
    }
  }



}
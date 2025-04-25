import Database from "@tauri-apps/plugin-sql";
import type { Tflight } from "../types/flight";
import type { Taircraft } from "$lib/types/aircraft";
import type { Tairport } from "$lib/types/airport";
import type { Tairline } from "$lib/types/airline";

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
    try {
      const db = await Database.load("sqlite:flylist.db")

      await db.execute("INSERT INTO flights (dep_airport, arr_airport, flight_num, callsign, ac_type, duration) VALUES ($1, $2, $3, $4, $5, $6)", [
        data.route.dep_airport,
        data.route.arr_airport,
        data.company.fl_no,
        data.company.callsign,
        data.ac_type.id,
        data.duration
      ])

      await db.close()
      return "success"
    } catch (error) {
      throw new Error(`Error when creating flight: ${error}`)
    }
  }

  static async getFlights(): Promise<Tflight[]> {

    try {
      const db = await Database.load("sqlite:flylist.db")

      const dbFlights = await db.select<TdbFlight[]>("SELECT * FROM flights")

      const flights: Tflight[] = await Promise.all(dbFlights.map(async (flight) => {

        const aircraft = await db.select<Taircraft[]>("SELECT * FROM aircraft WHERE id = $1", [ flight.ac_type])

        return {
          id: flight.id,
          ac_type: aircraft[0],
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
      }))

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
      throw new Error(`Error when archiving flight with id of '${updatedFlight.id}': ${error}`)
    }
  }

  static async createAircraft(aircraft: Taircraft): Promise<boolean> {
    try {
      const db = await Database.load("sqlite:flylist.db")

      // Check for required fields
      if (!aircraft.name || !aircraft.icao_code || !aircraft.manufacturer || !aircraft.model) {
        return false;
      }

      await db.execute("INSERT INTO aircraft (name, model, manufacturer, icao_code) VALUES ($1, $2, $3, $4)", [
        aircraft.name,
        aircraft.model,
        aircraft.manufacturer,
        aircraft.icao_code
      ]);

      await db.close()
      return true
    } catch (error) {
      throw new Error(`Error when creating aircraft: ${error}`)
    }
  }

  static async getAircraft(): Promise<Taircraft[]> {
    try {
      const db = await Database.load("sqlite:flylist.db")
      const aircraft = await db.select<Taircraft[]>("SELECT * FROM aircraft")

      await db.close()
      return aircraft
    } catch (error) {
      throw new Error(`Error when creating aircraft: ${error}`)
    }
  }

  static async deleteAircraft(aircraft: Taircraft): Promise<boolean> {
    try {
      const db = await Database.load("sqlite:flylist.db")

      await db.execute("DELETE FROM aircraft WHERE id = $1", [aircraft.id])

      // TODO: Make this also delete any flights using this aircraft

      await db.close()
      return true
    } catch (error) {
      throw new Error(`Error when deleting aircraft: ${error}`)
    }
  }


  static async createAirports(airports: Tairport[]): Promise<void> {
    try {
      const db = await Database.load("sqlite:flylist.db");
  
      const query = `
        INSERT INTO airports (id, type, name, latitude_deg, longitude_deg, elevation_ft, continent, iso_country, iso_region, icao_code, iata_code, home_link)
        VALUES ${airports.map((_, i) => `($${i * 12 + 1}, $${i * 12 + 2}, $${i * 12 + 3}, $${i * 12 + 4}, $${i * 12 + 5}, $${i * 12 + 6}, $${i * 12 + 7}, $${i * 12 + 8}, $${i * 12 + 9}, $${i * 12 + 10}, $${i * 12 + 11}, $${i * 12 + 12})`).join(", ")}
      `;
  
      const params = airports.flatMap(airport => [
        airport.id,
        airport.type,
        airport.name,
        airport.latitude_deg,
        airport.longitude_deg,
        airport.elevation_ft,
        airport.continent,
        airport.iso_country,
        airport.iso_region,
        airport.icao_code,
        airport.iata_code,
        airport.home_link,
      ]);
  
      await db.execute(query, params);
      await db.close();
    } catch (error) {
      throw new Error(`Error inserting batch of airports: ${error}`);
    }
  }

  static async getAirport(icao?: string, iata?: string): Promise<Tairport> {
    try {
      const db = await Database.load("sqlite:flylist.db")
      
      let query = "";
      let params: string[] = [];
  
      if (icao) {
        query = "SELECT * FROM airports WHERE icao_code = $1";
        params = [icao];
      } else if (iata) {
        query = "SELECT * FROM airports WHERE iata_code = $1";
        params = [iata];
      } else {
        throw new Error("Either ICAO or IATA code must be provided.");
      }
  
      const result = await db.select<Tairport[]>(query, params);

      if (result.length > 1) {
        throw new Error("Found more than one airport with this icao/iata code")
      }

      await db.close()
      return result[0]
    } catch (error) {
      throw new Error(`Error when creating table: ${error}`)
    }
  }

  static async createAirlines(airlines: Tairline[]): Promise<void> {
    try {
      const db = await Database.load("sqlite:flylist.db");
  
      const query = `
        INSERT INTO airlines (id, name, alias, iata, icao, callsign, country, active)
        VALUES ${airlines.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(", ")}
      `;
  
      const params = airlines.flatMap(airline => [
        airline.id,
        airline.name,
        airline.alias,
        airline.iata,
        airline.icao,
        airline.callsign,
        airline.country,
        airline.active ? 1 : 0, // Convert boolean to integer for SQLite
      ]);
  
      await db.execute(query, params);
      await db.close();
    } catch (error) {
      throw new Error(`Error inserting batch of airlines: ${error}`);
    }
  }

  private static toDbFlight(flight: Tflight): TdbFlight {
    return {
      ac_type: String(flight.ac_type.id),
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
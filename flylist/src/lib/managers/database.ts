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
  airline_icao: string,
  aircraft_id: number,
  duration: number,
  archived: number,
  created_at: Date,
  last_edited: Date,
}

/**
 * Interact with the app's internal Sqlite database
 */
export class FlyListDB {
  

  /**
   * Create a new flight within the '**flights**' table with provided data
   * @param data Flight data
   * @returns
   */
  static async createFlight(data: Tflight): Promise<boolean> {
    return withConnection(async (db) => {
      try {
        
        await db.execute("INSERT INTO flights (dep_airport, arr_airport, flight_num, callsign, aircraft_id, duration, airline_icao) VALUES ($1, $2, $3, $4, $5, $6, $7)", [
          data.route.dep_airport,
          data.route.arr_airport,
          data.company.fl_no,
          data.company.callsign,
          data.aircraft.id,
          data.duration,
          data.company.airline_icao
        ])
        
        return true
      } catch (error) {
        throw new Error(`Error when creating flight: ${error}`)
      }
    })
  }

  /**
   * Get all flights from database
   * @returns Array of flights
   */
  static async getFlights(): Promise<Tflight[]> {
    return this.withConnection(async (db) => {
      try {
        const dbFlights = await db.select<TdbFlight[]>("SELECT * FROM flights")
        
        const flights: Tflight[] = await Promise.all(dbFlights.map(async (flight) => {
          const aircraft = await db.select<Taircraft[]>("SELECT * FROM aircraft WHERE id = $1", [flight.aircraft_id])
          const airlines = await db.select<Tairline[]>("SELECT * FROM airlines WHERE icao = $1", [flight.airline_icao])
          
          return {
            id: flight.id,
            aircraft: aircraft[0],
            company: {
              callsign: flight.callsign,
              fl_no: flight.flight_num,
              airline_icao: flight.airline_icao,
              airline: airlines ? airlines[0] : undefined,
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
        
        return flights
      } catch (error) {
        throw new Error(`Error when reading flight(s): ${error}`)
      }
    })
  }

  /**
   * Delete a flight from the database
   * @param flight Flight to be deleted
   * @returns 
   */
  static async deleteFlight(flight: Tflight): Promise<boolean> {
    return this.withConnection(async (db) => {
      try {
        await db.execute("DELETE FROM flights WHERE id = $1", [flight.id])
        
        return true
      } catch (error) {
        throw new Error(`Error when deleting flight with id of '${flight.id}': ${error}`)
      }
    })
  }

  /**
   * Switch a flight between unarchived and archived
   * @param flight Flight to be toggled
   * @returns
   */
  static async toggleArchiveFlight(flight: Tflight): Promise<boolean> {
    return this.withConnection(async (db) => {
      try {
        await db.execute(`UPDATE flights SET archived = ${flight.archived === true ? "0" : "1"} WHERE id = $1`, [flight.id])
        
        return true
      } catch (error) {
        throw new Error(`Error when archiving flight with id of '${flight.id}': ${error}`)
      }
    })
  }

  /**
   * 
   * @param flight Original, unchanged flight data
   * @param updatedFlight Updated, flight data
   * @returns 
   */
  static async editFlight(flight: Tflight, updatedFlight: Tflight): Promise<boolean> {
    return this.withConnection(async (db) => {
      try {

        if (flight.id === updatedFlight.id) {
          throw "flight and updatedFlight {id} did not match"
        }
        
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
        
        return true
      } catch (error) {
        throw new Error(`Error when archiving flight with id of '${updatedFlight.id}': ${error}`)
      }
    })
  }

  /**
   * Create a new aircraft to be added to '**aircraft**' table to be available for creating flights
   * @param aircraft Aircraft to be created
   * @returns 
   */
  static async createAircraft(aircraft: Taircraft): Promise<boolean> {
    return this.withConnection(async (db) => {
      try {
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
        
        return true
      } catch (error) {
        throw new Error(`Error when creating aircraft: ${error}`)
      }
    })
  }

  /**
   * Get all aircraft from the database '**aircraft**'
   * @returns
   */
  static async getAircraft(): Promise<Taircraft[]> {
    return this.withConnection(async (db) => {
      try {
        const aircraft = await db.select<Taircraft[]>("SELECT * FROM aircraft")
        
        return aircraft
      } catch (error) {
        throw new Error(`Error when getting aircraft: ${error}`)
      }
    })
  }

  /**
   * Delete an aircraft and its related flights from database
   * @param aircraft Aircraft to be deleted
   * @returns 
   */
  static async deleteAircraft(aircraft: Taircraft): Promise<boolean> {
    return this.withConnection(async (db) => {
      try {
        await db.execute("DELETE FROM aircraft WHERE id = $1", [aircraft.id])
        await db.execute("DELETE FROM flights WHERE aircraft_id = $1", [aircraft.id])
        
        return true
      } catch (error) {
        throw new Error(`Error when deleting aircraft: ${error}`)
      }
    })
  }

  /**
   * Creates batch set of airports, inserting into '**airports**' table
   * @param airports Airports to be created
   * @returns 
   */
  static async createAirports(airports: Tairport[]): Promise<void> {
    return this.withConnection(async (db) => {
      try {
        
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

      } catch (error) {
        throw new Error(`Error inserting batch of airports: ${error}`);
      }
    })
  }

  /**
   * Fetch an airport from '**airports**' using either its ICAO or IATA code
   * @param icao Airport's ICAO code
   * @param iata Airport's IATA code
   * @returns 
   */
  static async getAirport(icao?: string, iata?: string): Promise<Tairport> {
    return this.withConnection(async (db) => {
      try {
        
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
        
        return result[0]
      } catch (error) {
        throw new Error(`Error when creating table: ${error}`)
      }
    })
  }

  /**
   * Creates batch set of airlines, inserting into '**airlines**' table
   * @param airlines Array of airlines to be created
   * @returns 
   */
  static async createAirlines(airlines: Tairline[]): Promise<void> {
    return this.withConnection(async (db) => {
      try {
        
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
      } catch (error) {
        throw new Error(`Error inserting batch of airlines: ${error}`);
      }
    })
  }

  /**
   * Fetch an airline from '**airlines**' with its ICAO code
   * @param icao ICAO of airline to be fetched
   * @returns 
   */
  static async getAirline(icao: string): Promise<Tairline> {
    return this.withConnection(async (db) => {
      try {
        const result = await db.select<Tairline[]>("SELECT * FROM airlines WHERE icao = $1", [icao]);
  
        if (result.length > 1) {
          throw new Error("Found more than one airline with this icao code")
        }
  
        return result[0]
      } catch (error) {
        throw new Error(`Error when creating table: ${error}`)
      }
    })
  }

  /**
   * Helper function - manages loading and closing of database
   * @param operation - Function that performs database operations
   * @returns Promise resolving to the result of the operation
   */
  private static async withConnection<T>(operation: (db: Database) => Promise<T>): Promise<T> {
    const db = await Database.load("sqlite:flylist.db");
    try {
      return await operation(db);
    } finally {
      await db.close();
    }
  }

  /**
   * Convert a Tflight value to TdbFlight to be able to send back to DB
   * @param flight
   * @returns
   */
  private static toDbFlight(flight: Tflight): TdbFlight {
    return {
      aircraft_id: flight.aircraft.id,
      archived: flight.archived ? 1 : 0,
      arr_airport: flight.route.arr_airport,
      dep_airport: flight.route.dep_airport,
      airline_icao: flight.company.airline_icao,
      callsign: flight.company.callsign,
      created_at: flight.created_at,
      duration: flight.duration,
      flight_num: flight.company.fl_no,
      id: flight.id,
      last_edited: flight.last_edited,
    }
  }

}
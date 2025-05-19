import type { Tairport } from "$lib/types/airport";
import type { TairportType } from "$lib/types/airportType";

/**
 * Convert data into airport type
 * @param data
 * @returns
 */
export function toAirportType(data: Record<string, unknown>): Tairport {
  return {
    id: data.id as number,
    type: data.type as TairportType,
    name: data.name as string,
    latitude_deg: data.latitude_deg as number,
    longitude_deg: data.longitude_deg as number,
    elevation_ft: data.elevation_ft as number,
    continent: data.continent as string,
    iso_country: data.iso_country as string,
    iso_region: data.iso_region as string,
    icao_code: data.icao_code as string,
    iata_code: data.iata_code as string,
    home_link: data.home_link as string,
  };
}
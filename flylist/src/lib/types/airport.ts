import type { TairportType } from "./airportType";

export type Tairport = {
  id: number;
  type: TairportType;
  name: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_ft?: number;
  continent: string;
  iso_country: string;
  iso_region: string;
  icao_code?: string;
  iata_code?: string;
  home_link?: string;
};
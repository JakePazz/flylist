import type { Tairline } from "$lib/types/airline";

export function toAirlineType(data: Record<string, unknown>): Tairline {
  // Handle case where fields might have different names
  const id = data.id ?? data.airline_id ?? data[0];
  const name = data.name ?? data[1];
  const rawAlias = data.alias ?? data[2];
  const iata = data.iata ?? data.iata_code ?? data[3];
  const icao = data.icao ?? data.icao_code ?? data[4];
  const callsign = data.callsign ?? data[5];
  const country = data.country ?? data[6];
  
  // Handle different formats of "active" field
  let active = data.active ?? data[7];
  if (active === "Y" || active === "y" || active === "1") {
    active = true;
  } else if (active === "N" || active === "n" || active === "0") {
    active = false;
  }

  // Check required fields
  if (!icao || icao === "\\N" || !callsign || callsign === "\\N" || !country || country === "\\N") {
    throw new Error("Missing required fields: icao, callsign, or country");
  }

  // Handle \N in alias field
  const alias = rawAlias && rawAlias !== "\\N" ? String(rawAlias) : undefined;
  

  return {
    id: Number(id),
    name: String(name || "Unknown"),
    alias: alias ? String(alias) : undefined,
    iata: iata ? String(iata) : undefined,
    icao: String(icao || ""),
    callsign: String(callsign || ""),
    country: String(country || ""),
    active: Boolean(active),
  };
}
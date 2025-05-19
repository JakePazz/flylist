export type Tmetar = {
  icao: string,
  barometer: {
    hg: number,
    hpa: number,
    kpa: number,
    mb: number,
  },
  clouds?: {
    base_feet_agl: number,
    base_meters_agl: number,
    code: string,
    text: string,
    feet: number,
    meters: number,
  }[],
  ceiling?: {
    feet: number,
    meters: number,
  },
  dewpoint: {
    celsius: number,
    fahrenheit: number,
  },
  elevation: {
    feet: number,
    meters: number,
  },
  flight_category: string,
  humidity: {
    percent: number,
  },
  observed: string,
  temperature: {
    celsius: number,
    fahrenheit: number,
  },
  raw_text: string,
  visibility: {
    miles: number,
    miles_text: string,
    meters: number,
    meters_text: string,
  },
  wind: {
    degrees: number,
    speed_kph: number,
    speed_kts: number,
    speed_mph: number,
    speed_mps: number,
    gust_kph?: number,
    gust_kts?: number,
    gust_mph?: number,
    gust_mps?: number,
  },
  rain?: {
    inches: number,
    millimeters: number,
  },
  snow?: {
    inches: number,
    millimeters: number,
  }
}
export type TunitPreferences = {
  altitude: "feet" | "meters",
  barometer: "hg" | "hpa" | "kpa" | "mb" // inches of mercury, hectopascals, kilopascals, millibars
  general_distance: "imperial" | "metric",
  wind_speed: "kph" | "kts" | "mph" | "mps",
  precipitation_measurement: "imperial" | "metric",
  temperature: "celsius" | "fahrenheit"
}
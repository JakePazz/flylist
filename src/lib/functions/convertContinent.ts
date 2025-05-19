/**
 * Convert a continent code into the written continent string value
 * @param continentCode Standard continent code
 * @returns Full written continent
 */
export function convertContinent(continentCode: string) {
  const continents: { [key: string]: string } = {
    "AF": "Africa",
    "AN": "Antarctica",
    "AS": "Asia",
    "EU": "Europe",
    "NA": "North America",
    "OC": "Oceania",
    "SA": "South America"
  }

  return continents[continentCode]
}
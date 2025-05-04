# FlyList

A small tauri/SvelteKit application to track your wishlist of virtual flights

## Technologies

- SvelteKit
- TypeScript
- Tauri
- Flowbite Svelte
- sqlite DB (tauri plugin)
- HugeIcons (stored as svgs within lib/assets/hugeicons)

## Database

The app uses a sqlite database that stores all data locally on the device that is held within the app. Note that some settings and cache data is instead stored within tauri-stores; json documents within the app's directory.

### Tables

- **aircraft**: All aircraft that are referenced within flights
- **airlines**: Dataset with all common airlines fetched from [openflights.org](https://openflights.org/data.php#airline)
- **airports**: Dataset with airports from [ourairports.com](https://ourairports.com/data/)
- **flights**: Core table that stores all of the user's wishlist flights

## Data

- METAR fetched from [CheckWX API](https://www.checkwxapi.com/)
- Airports from [ourairports.com](https://ourairports.com/data/)
- Airlines from [openflights.org](https://openflights.org/data.php#airline)

### Settings

Settings are kept within `settings.json` in the app's directory. Settings are all typed and defaulted in multiple locations.

_Note: To manually change the settings close the dev server otherwise changes are ignored and overwritten upon closing._

### Future Developments

Features that could be useful that could be added in the future

- List Filters (e.g: airport, airline icao, aircraft, min/max length)
- Reset DB Btn
  - Hard Reset Btn for all settings
- Scheduling of Flights
- GSX Profile scanner integration? Check if a GSX profile is available for an airport
- Updater w/ Changelog tab in settings to show current version and newest version as well as history of changelog

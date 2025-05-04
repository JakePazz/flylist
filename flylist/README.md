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
- Updater

## TODO

- [X] Update flight
- [X] Delete flight
- [X] Archive flight
- [X] Validate create flight inputs (<https://ourairports.com/data/>)
- [X] Turn aircraft input into radio dropdown
- [X] Create archive page
- [X] Create settings page & contents listed below
- [X] Add access to created and last_edit info in table
- [X] Add airlines to table (<https://openflights.org/data.php#airline>)
- [X] Add Airport name on hover of ICAO code
- [X] Add double click information menu to flight list
  - [X] Arrival Airport (w/weather fetching)
  - [X] Departure Airport (w/weather fetching)
  - [X] Aircraft - added to popover
  - [X] Simbrief button
- [X] Update flight list to populate aircraft with the column storing the id of the aircraft and show name
- [X] Complete expanded flight
  - [X] Add API key input and measurement selection into settings
  - [X] Create metar manager - try and get some kind of airport data caching working where it stores them then will call DB again if out of date by at least 30m
  - [X] Add Hard reload for metar - put button next to metar copy to clipboard to bypass caching as a backup
- [X] Add confirm modal to delete action in /flights/list
- [X] Update /setup to work with changes made to settings management
- [X] Improve documentation & Commenting
- [X] Improve logging
- [ ] Add information section to settings
  - Report issues
  - Where to find information
  - Licensing
  - Credits
- [ ] Create icon (google for command)

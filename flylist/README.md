# FlyList

A small tauri/SvelteKit application to track your wishlist of virtual flights

## Technologies

- SvelteKit
- TypeScript
- Tauri
- Flowbite Svelte
- sqlite DB (tauri plugin)
- HugeIcons

## Data

- METAR fetched from [CheckWX API](https://www.checkwxapi.com/)
- Airports from [ourairports.com](https://ourairports.com/data/)
- Airlines from [openflights.org](https://openflights.org/data.php#airline)

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
- [ ] Improve documentation & Commenting
- [ ] Improve logging
- [ ] Add information section to settings
  - Report issues
  - Where to find information
  - Licensing
  - Credits
- [ ] Create icon (google for command)

### Settings

Settings are kept within `settings.json` in the app's directory. Preferences are stored within a preferences object that is typed with Tpreferences.

### Future Developments

Features that could be useful that could be added in the future

- List Filters (e.g: airport, airline icao, aircraft, min/max length)
- Scheduling of Flights
- Reset DB Btn
  - Hard Reset Btn for all settings
- Updater

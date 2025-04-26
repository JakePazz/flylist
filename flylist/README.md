# FlyList

A small tauri/SvelteKit application to track your wishlist of virtual flights

## Technologies

- SvelteKit
- TypeScript
- Tauri
- Flowbite Svelte
- sqlite DB (tauri plugin)

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
- [ ] Add airport weather fetching and formatting (<https://aviationweather.gov/api/data/metar?ids=EGLL&format=json>)
- [ ] Add double click information menu to flight list
- [ ] Add confirm modal to delete action in /flights/list
- [X] Update flight list to populate aircraft with the column storing the id of the aircraft and show name
- [ ] Improve documentation

### Settings

Settings are kept within `settings.json` in the app's directory. Preferences are stored within a preferences object that is typed with Tpreferences.

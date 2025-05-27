# FlyList

A small Tauri x Svelte windows app to track your wishlist of virtual flights

## What is it?

FlyList is a desktop application designed for flight simulation enthusiasts to (pedantically) organize and track their virtual flight wishlist.

### Your Flights

The important bit, where you can view a table of all your stored flights. This table allows you to:

- sort columns by their headings, such as 'duration'
- Opening a flight's history on [FlightRadar24](https://www.flightradar24.com/) - if it's an up-to-date flight number...
- Editing the flight's information
- Archiving or deleting the flight

#### Expanded flight

On this page, you can double click a flight's row to open it's expanded view and see:

- Basic flight overview
  - Arrival & departure airports alongside the flight duration and id
  - Airline and their callsign
  - 'Open in Simbrief' button to import the flight's info SimBrief
- Departure and arrival airport
  - Continent, ICAO and IATA codes
  - Open location on google maps
  - METAR information fetched from [CheckWX API](https://www.checkwxapi.com/)

### Create a Flight

Create a new flight to be added to your table

### Archive

A table of all your archived flights and not much more

### Settings

A couple settings. Has tabs for:

- Settings; your preferences and CheckWX API configuratiion
- Aircraft; A list of aircraft to be used for your flights created by you
- Information; some information on the app and shows your version number incase you forget

_Access and change your **CheckWX API key** within `settings > CheckWX Metar API Settings`_

## Technologies

- SvelteKit
- TypeScript
- Tauri
- Flowbite Svelte
- SQLite DB (tauri plugin)
- HugeIcons (stored as svgs within `lib/assets/hugeicons`)

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

## Storing Settings

Settings are kept within `settings.json` in the app's directory. Settings are all typed and defaulted in multiple locations.

_Note: To manually change the settings during development close the dev server, otherwise changes are ignored and overwritten upon closing._

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- Tauri (more guidance [here](https://tauri.app/start/prerequisites/))
  - [Rust](https://www.rust-lang.org/tools/install)
  - [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/?form=MA13LH#download-section)

### Setup

1. Clone the repository

```bash
git clone https://github.com/JakePazz/flylist.git
```

2. Install dependencies

```bash
npm install
```

3. Setup development environment

- Create a CheckWX API key at CheckWX API
- On first run, the app will guide you through setup including adding this key

_I recommend making a copy of a set of test settings and data in case of future issues_

4. Run it

```bash
npm run tauri dev
```

5. Build it

```bash
npm run tauri build
```

### Project Structure

- `src` - SvelteKit frontend code
  - `/lib` - Shared components and utilities
    - `/managers` - Core service classes (database, settings, etc.)
    - `/components` - Reusable Svelte components
    - `/types` - TypeScript type definitions
    - `/stores`- Svelte stores
    - `/functions` - Utility functions
  - `/routes` - SvelteKit pages with file-based routing
- `src-tauri` - Tauri backend code
  - `/src` - Rust code

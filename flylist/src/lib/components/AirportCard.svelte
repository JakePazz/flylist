<script lang="ts">
  import { convertContinent } from "$lib/functions/convertContinent";
  import type { Tairport } from "$lib/types/airport";
  import { Button, Card, DropdownDivider, Spinner, Tooltip } from "flowbite-svelte";
  import { CheckOutline, ClipboardCleanOutline, ClockOutline, GlobeOutline, MapPinAltOutline, RefreshOutline } from "flowbite-svelte-icons";
  import Cloud from "$lib/assets/hugeicons/Cloud.svg"
  import { open } from '@tauri-apps/plugin-shell';
  import AirplaneTakeoff from "$lib/assets/hugeicons/AirplaneTakeoff01.svg"
  import AirplaneLanding from "$lib/assets/hugeicons/AirplaneLanding01.svg"
  import Compass from "$lib/assets/hugeicons/Compass.svg"
  import FastWind from "$lib/assets/hugeicons/FastWind.svg"
  import Humidity from "$lib/assets/hugeicons/Humidity.svg"
  import Dial from "$lib/assets/hugeicons/Dial.svg"
  import Droplet from "$lib/assets/hugeicons/Droplet.svg"
  import Temperature from "$lib/assets/hugeicons/Temperature.svg"
  import Rain from "$lib/assets/hugeicons/Rain.svg"
  import Snow from "$lib/assets/hugeicons/Snow.svg"
  import { getToast } from "$lib/stores/toast.svelte";
  import { writeText } from "@tauri-apps/plugin-clipboard-manager";
  import { MetarManager } from "$lib/managers/metar";
  import type { Tmetar } from "$lib/types/metar";
  import type { TunitPreferences } from "$lib/types/unitPreferences";
  import { onMount } from "svelte";
  import { SettingsManager } from "$lib/managers/settings";

  const { airport, type }: { airport: Tairport, type: "arrival" | "departure" } = $props();
  const toast = getToast()
  
  let metar: Tmetar | undefined = $state()
  let loadingMetar = $state(false)
  let units: TunitPreferences = $state({
    altitude: "feet",
    barometer: "hpa",
    general_distance: "metric",
    precipitation_measurement: "metric",
    wind_speed: "kts",
    temperature: "celsius"
  })
  
  $effect(() => {
    loadMetar()
  })

  onMount(async () => {
    const preferences = await SettingsManager.getPreferences()
    units = preferences.units
  })
  

  /**
   * Load METAR from MetarManager for instance's `airport` - if no api key or error will ignore weather info
   */
  async function loadMetar() {
    if (!airport?.icao_code) return;
    
    loadingMetar = true;

    try {
      metar = await MetarManager.get(airport.icao_code);
    } catch (error) {
      console.warn("Unable to load METAR due to error when fetching from MetarManager")
      loadingMetar = false;
    }
    
    // Sort clouds in reverse height order
    if (metar?.clouds) {
      metar.clouds = metar.clouds.sort((a, b) => b.base_feet_agl - a.base_feet_agl)
    }

    loadingMetar = false;
  }

  /**
   * Open airport in google maps based off stored lat and long
   * @param lat
   * @param long
   */
  function openInGoogleMaps(lat: number, long: number) {
    try {
      open(`https://www.google.com/maps/search/?api=1&query=${lat},${long}`)
    } catch (error) {
      console.error(`Error calling openInGoogleMaps(): ${error}`)
    }
  }

  /**
   * Send raw metar to clipboard
  */
  async function copyMetar() {

    if (airport.icao_code && metar) {
      try {
        await writeText(metar.raw_text)

        toast.addToast({
          title: `Copied ${airport.icao_code} metar`,
          type: "info"
        })
      } catch (error) {
        toast.addToast({
          title: `Error when trying to copy to clipboard: ${error}`,
          type: "error"
        })
      }
    } else {
      toast.addToast({
        title: "ICAO code or METAR unavailable",
        type: "error"
      })
    }
  }

  /**
   * Force a new call to the MetarManager.get() that will gaurantee up-to-date METAR data
   */
  async function forceMetarReload() {
    try {
      if (!airport.icao_code) throw "No 'icao_code' on airport"
      metar = await MetarManager.get(airport.icao_code, true)
      toast.addToast({
        title: `Reloaded ${airport.icao_code} METAR`,
        type: "info"
      })

    } catch (error) {
      console.error(`Error when forcing metar reload`)
      toast.addToast({
        title: `Failed to reload METAR for ${airport.icao_code}`,
        type: "error"
      })
    }
  }

</script>

<Card class="!py-5">
  <span class="flex gap-3 items-center">
    <img title="Departure Information" class="w-8 h-8" src={type === "arrival" ? AirplaneLanding : AirplaneTakeoff} alt="Airport Icon">
    <Tooltip>{type === "arrival" ? "Arrival Information" : "Departure Information"}</Tooltip>
    <h3 class="text-lg text-balance font-medium text-gray-900 dark:text-white">{airport.name || "Arrival Airport"}</h3>
    {#if airport.longitude_deg && airport.latitude_deg}
        <!-- Push btn to end -->
        <span class="flex-1"></span>
        <Button class="w-max px-3" color="alternative" onclick={() => {
            // Use non-null assertion operator (!) to tell TypeScript you're sure these values exist
            openInGoogleMaps(
              airport.latitude_deg,
              airport.longitude_deg
            )
        }}><MapPinAltOutline /> </Button>
    {/if}
  </span>
  <span class="text-gray-400 flex gap-2 items-center mt-2 italic">
    {#if airport.continent}
      <GlobeOutline/> 
      <p>{convertContinent(airport.continent)}</p>
      <Tooltip>Continent</Tooltip>
    {/if}
    <span class="flex-1"></span>
    <p>{airport.icao_code}</p>
    <Tooltip>ICAO</Tooltip>
    {#if airport.iata_code}
      <span class="w-1.5 h-1.5 rounded bg-gray-700"></span>
      <p>{airport.iata_code}</p>
      <Tooltip>IATA</Tooltip>
    {/if}
  </span>

  <!-- Weather display -->
  {#if metar}
    {#key metar}
      <DropdownDivider class="mt-3 mb-4 !bg-gray-700" />
      <div class="w-full flex gap-6 justify-between px-3">
        
        <!-- Temp, Dewpoint, Pressure -->
        <div class="flex flex-col gap-1.5 items-start justify-start">
          <span class="flex items-center gap-1">
            <img class="w-5 h-5" src={Temperature} alt="Temperature Icon of Thermometer">
            <p class="text-gray-200 font-medium">{units.temperature === "celsius" ? metar.temperature.celsius : metar.temperature.fahrenheit}&deg;</p>
          </span>
          <Tooltip>Temperature ({units.temperature === "celsius" ? "Celsius" : "Fahrenheit"})</Tooltip>
          
          <span class="flex items-center gap-1">
            <img class="w-5 h-5" src={Droplet} alt="Dewpoint Icon of raindrop">
            <p class="text-gray-200 font-medium">{units.temperature === "celsius" ? metar.dewpoint.celsius : metar.dewpoint.fahrenheit}&deg;</p>
          </span>
          <Tooltip>Dewpoint ({units.temperature === "celsius" ? "Celsius" : "Fahrenheit"})</Tooltip>
          
          <span class="flex items-center gap-1">
            <img class="w-5 h-5" src={Dial} alt="Pressure Icon of Dial">
            <p class="text-gray-200 font-medium">{metar.barometer[units.barometer]}</p>
          </span>
          <Tooltip>Pressure ({units.barometer == "hg" ? "InHg" : units.barometer})</Tooltip>
        </div>
        
        <!-- Flight Category, Visiblity -->
        <div class="flex flex-col items-center justify-center">
          <span class="bg-green-500 mx-2 mb-1 text-white font-medium px-3 py-2 rounded-lg ">{metar.flight_category}</span>
          <Tooltip>Flight Category</Tooltip>
          <p id="visibility-numeric">{metar.visibility[units.general_distance === "metric" ? "meters" : "miles"]}</p>
          <Tooltip triggeredBy="#visibility-numeric" >Visibility {metar.visibility[units.general_distance === "metric" ? "meters_text" : "miles_text"].toLowerCase()}m</Tooltip>
        </div>
        
        <!-- Clouds -->
        <div class="flex flex-col justify-center">
          {#if metar.clouds}
            {#each metar.clouds as cloud, index}
              {#if index !== 0}
              <!-- Seperator line -->
              <DropdownDivider class="!bg-gray-700 w-[40%] self-center" />
              {/if}
              <!-- Cloud outline -->
              <div class="flex gap-2 items-center">
                <img src={Cloud} alt="Cloud Icon">
                <p class="text-gray-300 font-medium">{cloud.code}</p>
                <Tooltip>{cloud.text}</Tooltip>
                <span class="flex flex-col items-center justify-around">
                  <p>{units.altitude === "feet" ? cloud.feet : cloud.meters}</p>
                  <Tooltip>Cloud Height {cloud.base_feet_agl == cloud.feet ? "& Base" : ""} ({units.altitude === "feet" ? "feet" : "meters"})</Tooltip>
                  {#if cloud.base_feet_agl != cloud.feet}
                    <span class="w-[100%] h-[2px] rounded bg-gray-200"></span>
                    <p>{cloud[units.altitude]}</p>
                    <Tooltip>Cloud Base (feet)</Tooltip>
                  {/if}
                </span>
              </div>
            {/each}
          {:else}
            <span class="flex flex-col items-center justify-center">
              <img src={Cloud} alt="Cloud Icon" class="w-8 h-8">
              <p class="italic text-sm">No Clouds</p>
            </span>
          {/if}
          
          {#if metar.ceiling}
          <span class="w-full h-[2px] rounded bg-gray-200 mb-0.5"></span>
          <p class="text-center">{metar.ceiling[units.altitude]}</p>
          <Tooltip>Ceiling (feet)</Tooltip>
          {/if}
        </div>
      </div>
      
      <!-- Wind, Humidity -->
      <div class="flex items-center gap-8 justify-center mt-2 flex-wrap">
        {#if metar.humidity}
        <span class="flex gap-2 items-center">
          <img class="w-5 h-5" src={Humidity} alt="Humidity Icon of a Raindrop">
          <p class="text-lg font-medium">{metar.humidity.percent}%</p>
          <Tooltip>Humidity</Tooltip>
        </span>
        {/if}
        
        {#if metar.wind}
        <span class="flex gap-2 items-center">
          <img class="w-5 h-5" src={FastWind} alt="Wind Speed Icon">
          <p class="text-lg font-medium">{metar.wind[`speed_${units.wind_speed}`]}kts</p>
          <Tooltip>Wind Speed (knots)</Tooltip>
        </span>
        
        <span class="flex gap-2 items-center">
          <img class="w-5 h-5" src={Compass} alt="Wind Direction Icon of a Compass">
          <p class="text-lg font-medium">{metar.wind.degrees}&deg;</p>
          <Tooltip>Wind Direction (Degrees)</Tooltip>
        </span>
        {/if}
      </div>
      
      {#if metar.rain || metar.snow}
      <div class="flex items-center gap-8 justify-center mt-2 flex-wrap">
        
        <span class="flex gap-2 ">
          <img class="w-5 h-5 " src={Rain} alt="Raining Icon">
          <CheckOutline class="text-green-500" />
        </span>
        <Tooltip>It is {metar.rain ? "raining" : "not raining"}</Tooltip>
        
        <span class="flex gap-2 ">
          <img class="w-5 h-5 " src={Snow} alt="Raining Icon">
          <CheckOutline class="text-green-500" />
        </span>
        <Tooltip>It is {metar.snow ? "snowing" : "not snowing"}</Tooltip>

      </div>
      {/if}
      
      <DropdownDivider class="mt-4 mb-3 !bg-gray-700" />
      <div class="flex justify-between items-center gap-2">
        <span class="flex items-center gap-1">
          <ClockOutline />
          <p class="text-sm text-gray-400 font-medium italic">
            Observed {new Date(metar.observed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: "UTC" })}Z
          </p>
        </span>
        <Tooltip>METAR observation time in UTC</Tooltip>

        <span class="flex items-center gap-2 justify-end">
          <Button id="force-metar-reload-btn" onclick={() => {forceMetarReload()}} color="alternative" size="sm" class="px-3" > <RefreshOutline /> </Button>
          <Tooltip triggeredBy="#force-metar-reload-btn">Force Reload METAR</Tooltip>
          <Button onclick={() => {copyMetar()}} class="flex gap-1" size="sm" color="alternative"> <ClipboardCleanOutline />Metar</Button>
          <Tooltip>Copy METAR to Clipboard</Tooltip>
        </span>
      </div>
    {/key}
    
  {:else if !metar && loadingMetar}
    <span class="w-full mt-7 mb-3 mx-auto text-center">
      <Spinner />
      <p class="text-sm italic" >Loading metar</p>
    </span>
  {/if}
</Card>
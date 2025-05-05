<script lang="ts">
  import type { Tpreferences } from "$lib/types/preferences";
  import { load } from "@tauri-apps/plugin-store";
  import { Button, Input, Modal, Progressbar, StepIndicator } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { exit, relaunch } from '@tauri-apps/plugin-process';
  import { FlyListDB } from "$lib/managers/database";
  import { goto } from "$app/navigation";
  import { toAirportType } from "$lib/functions/toAirportType";
  import { toAirlineType } from "$lib/functions/toAirlineType";
  import { processCSV } from "$lib/functions/processCSV";
  import { SettingsManager } from "$lib/managers/settings";
  import { CogOutline } from "flowbite-svelte-icons";
  import ExternalLink from "$lib/components/ExternalLink.svelte";


  let message: string = $state("We're setting everything up for you...")
  let errorModal: boolean = $state(false)
  let errorContent: string = $state("")

  let apiKey: string = $state("")

  onMount(async () => {

    const settings = await load("settings.json")

    const complete = await settings.get<boolean>("setup_complete")

    // Final check that setup is required - back to '/' if not req.
    if (complete) {
      goto("/") 
    }

    await setup()
  })

  const airportsUrl = "https://davidmegginson.github.io/ourairports-data/airports.csv"
  const airlinesUrl = "https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat";

  let currentStep = $state(1)
  let airportsProgressPercentage = $state(0)
  let airlinesProgressPercentage = $state(0)

  let steps = ["Create settings.json", "Download airports data", "Download airlines data", "Configuration", "Setup complete"]

  async function setup() {

    await new Promise(resolve => setTimeout(resolve, 3000))

    try {
      // Set default preferences in settings.json
      currentStep = 1
      const settings = await load("settings.json", { createNew: true })

      const defaultSettings: Tpreferences = {
        toasts: {
          error_duration: 5000,
          info_success_duration: 1500
        },
        table_row_count: 10,
        units: {
          altitude: "feet",
          barometer: "hpa",
          general_distance: "metric",
          wind_speed: "kts",
          precipitation_measurement: "metric",
          temperature: "celsius"
        }
      }

      await settings.set("preferences", defaultSettings)
      await settings.save()
      await settings.close()

      // Get and create table with all airports

      message = "Importing airports data from ourairports.com"
      currentStep = 2

      // Clear contents of each database table before inserting new data from csv files
      await FlyListDB.clearDatabase()

      // Create 'airports' table from online airports data
      const airportsResult = await processCSV({
        url: airportsUrl,
        message: "Importing airports data from ourairports.com",
        transformFunction: toAirportType,
        saveFunction: (airports) => FlyListDB.createAirports(airports),
        setProgress: (percentage) => { airportsProgressPercentage = percentage; },
        updateMessage: (msg) => { message = msg; },
        hasHeaders: true,
      });

      if (!airportsResult.success) {
        errorModal = true
        errorContent = airportsResult.error || "Unknown error processing airports"
        return
      }

      message = `Airport data import complete (${airportsResult.count} airports processed)`

      currentStep = 3
      
      // Create 'airlines' table from online airlines data
      const airlinesResult = await processCSV({
        url: airlinesUrl,
        message: "Importing airlines data",
        transformFunction: toAirlineType,
        saveFunction: (airlines) => FlyListDB.createAirlines(airlines),
        setProgress: (percentage) => { airlinesProgressPercentage = percentage; },
        updateMessage: (msg) => { message = msg; },
        hasHeaders: false,
      });

      if (!airlinesResult.success) {
        errorModal = true
        errorContent = airlinesResult.error || "Unknown error processing airlines"
        return
      }

      message = `Airline data import complete (${airlinesResult.count} airlines processed)`

      currentStep = 4

    } catch (error) {
      console.error(error)
      errorModal = true
      if (error) {
        errorContent = String(error)
      }
    }
    
  }

  async function completeSetup() {
    try {

      if (apiKey != "") {
        await SettingsManager.saveMetarAPISettings({
          cacheOutdatedAgeMinutes: 30,
          key: apiKey
        })
      }

      // Setup is complete
      currentStep = 5;
      
      // Mark setup as complete in settings
      await SettingsManager.saveSetting("setup_complete", true)
    } catch (error) {
      console.error(error)
      errorModal = true
      errorContent = JSON.stringify(error) || "Unknown error completing setup"
      return;
    }

    // Restart for normal use
    try {
      await relaunch();
    } catch (innerError) {
      console.error("Failed to restart:", innerError);
      errorModal = true;
      errorContent = `Failed to restart application: ${innerError}. Please manually relaunch to start using the app.`;
    }
  } 

  async function closeApp() {
    await exit(1)
  }

  async function restartApp() {
    await relaunch()
  }

</script>


<div class="w-full h-screen flex flex-col gap-2 justify-center items-center px-12">
  <StepIndicator {steps} {currentStep} class="space-y-2 dark:text-white w-full" glow />
  {#if currentStep == 2}
    <span class="w-full text-left mt-2">
      <Progressbar labelOutside="Progress" progress={airportsProgressPercentage} />
      <p class="text-gray-400 italic text-sm text-left">Data found at <ExternalLink link="https://ourairports.com/data/">ourairports.com</ExternalLink></p>
    </span>
  {:else if currentStep == 3}
    <span class="w-full text-left mt-2">
      <Progressbar labelOutside="Progress" progress={airlinesProgressPercentage} />
      <p class="text-gray-400 italic text-sm text-left">Data found at <ExternalLink link="https://openflights.org/data.php#airline">openflights.org</ExternalLink></p>
    </span>
  {:else if currentStep == 4}
    <span class="w-full text-left mt-2">
      <p class="text-white ">
        Provide an API key from
        <ExternalLink link="https://www.checkwxapi.com/">CheckWX API</ExternalLink>
        to be able to view METAR information for airports
      </p>
      <p class="italic text-gray-400 text-sm flex ">You can continue without providing an API Key - you can always add it later in <CogOutline class="mx-1" /> settings</p>

      <Input class="w-48 mb-2 mt-5" bind:value={apiKey} type="password"></Input>

      <Button onclick={() => {completeSetup()}}>Continue</Button>
    </span>
  {/if}
</div>

<Modal dismissable={false} classHeader="text-red-700" bind:open={errorModal} autoclose>
  <h1 slot="header" class="text-red-400 font-medium text-xl">An Error Occurred</h1>
  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">Looks like an issue occurred while trying to set up FlyList. Please seek help to resolve this issue.</p>
  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-300 font-medium mb-1">Error Code</p>
  <p class="text-base leading-relaxed text-gray-500 dark:text-gray-400">"{errorContent}"</p>
  <svelte:fragment slot="footer">
    <Button onclick={async () => {closeApp()}}>Close</Button>
    <Button color="alternative" onclick={async () => {restartApp()}}>Restart</Button>
  </svelte:fragment>
</Modal>
<script lang="ts">
  import type { Tpreferences } from "$lib/types/preferences";
  import { load } from "@tauri-apps/plugin-store";
  import { Button, Modal, Progressbar, Spinner, StepIndicator, Toast } from "flowbite-svelte";
  import { onMount } from "svelte";
  import { exit, relaunch } from '@tauri-apps/plugin-process';
  import Papa from 'papaparse';
  import { FlyListDB } from "$lib/db/database";
  import type { Tairport } from "$lib/types/airport";
  import type { TairportType } from "$lib/types/airportType";
  import { goto } from "$app/navigation";
  import { toAirportType } from "$lib/functions/toAirportType";
  import { toAirlineType } from "$lib/functions/toAirlineType";
  import { processCSV } from "$lib/functions/processCSV";
  import { Window } from '@tauri-apps/api/window';


  let message: string = $state("We're setting everything up for you...")
  let errorModal: boolean = $state(false)
  let errorContent: string = $state("")

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
  let airlinesProgressPercentage = $state(0);

  let steps = ["Create settings.json", "Download airports data", "Download airlines data", "Setup complete"]

  async function setup() {

    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Set default preferences in settings.json
      currentStep = 1
      const settings = await load("settings.json", { createNew: true })

      const defaultSettings: Tpreferences = {
        error_duration: 5000,
        info_success_duration: 1500,
        table_row_count: 10,
      }

      await settings.set("preferences", defaultSettings)
      await settings.save()
      await settings.close()

      // Get and create table with all airports

      message = "Importing airports data from ourairports.com"
      currentStep = 2

      const airportsResult = await processCSV({
        url: airportsUrl,
        message: "Importing airports data from ourairports.com",
        transformFunction: toAirportType,
        saveFunction: FlyListDB.createAirports,
        setProgress: (percentage) => { airportsProgressPercentage = percentage; },
        updateMessage: (msg) => { message = msg; },
        hasHeaders: true,
      });

      if (!airportsResult.success) {
        errorModal = true;
        errorContent = airportsResult.error || "Unknown error processing airports";
        return;
      }

      message = `Airport data import complete (${airportsResult.count} airports processed)`;

      currentStep = 3
      
      const airlinesResult = await processCSV({
        url: airlinesUrl,
        message: "Importing airlines data",
        transformFunction: toAirlineType,
        saveFunction: FlyListDB.createAirlines,
        setProgress: (percentage) => { airlinesProgressPercentage = percentage; },
        updateMessage: (msg) => { message = msg; },
        hasHeaders: false,
      });

      if (!airlinesResult.success) {
        errorModal = true;
        errorContent = airlinesResult.error || "Unknown error processing airlines";
        return;
      }

      message = `Airline data import complete (${airlinesResult.count} airlines processed)`;
      
      // Setup is complete
      currentStep = 4;
      console.log("GOT HERE 1")
      
      // Mark setup as complete in settings
      const settingsSetupComplete = await load("settings.json");
      await settingsSetupComplete.set("setup_complete", true);
      await settingsSetupComplete.save();
      await settingsSetupComplete.close();

    } catch (error) {
      console.log(error)
      errorModal = true
      if (error) {
        errorContent = String(error)
      }
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
      <p class="text-gray-400 italic text-sm text-left">Data found at <a class="font-medium text-primary-600 hover:underline dark:text-primary-500" target="_blank" href="https://ourairports.com/data/">ourairports.com</a></p>
    </span>
  {:else if currentStep == 3}
    <span class="w-full text-left mt-2">
      <Progressbar labelOutside="Progress" progress={airlinesProgressPercentage} />
      <p class="text-gray-400 italic text-sm text-left">Data found at <a class="font-medium text-primary-600 hover:underline dark:text-primary-500" target="_blank" href="https://openflights.org/data.php#airline">openflights.org</a></p>
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
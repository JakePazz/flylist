<script lang="ts">
  import { FlyListDB } from "$lib/managers/database";
  import { formatDate } from "$lib/functions/formatDate";
  import { getToast } from "$lib/stores/toast.svelte";
  import { type Taircraft } from "$lib/types/aircraft";
  import { Button, Dropdown, Input, Label, Li, List, Modal, Radio, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tabs, Tooltip } from "flowbite-svelte";
  import { ArrowsRepeatOutline, ChevronDownOutline, CloseOutline, EyeOutline, FireOutline, FloppyDiskOutline, PlusOutline, TrashBinOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import type { Tsettings } from "$lib/types/settings";
  import { SettingsManager } from "$lib/managers/settings";
  import { MetarManager } from "$lib/managers/metar";
  import { relaunch } from "@tauri-apps/plugin-process";
  import ExternalLink from "$lib/components/ExternalLink.svelte";
  import { getVersion } from "@tauri-apps/api/app";
  
  const toast = getToast()

  let aircraft = $state<Taircraft[]>([])
  let showAPIKey = $state(false)
  let appVersion = $state("")

  const EMPTY_AIRCRAFT = {
    id: 0,
    icao_code: "",
    manufacturer: "",
    model: "",
    name: "",
  }
  let newAircraft = $state<Taircraft>(EMPTY_AIRCRAFT)

  let settings: Tsettings = $state({
    preferences: {
      table_row_count: 10,
      toasts: {
        info_success_duration: 1500,
        error_duration: 5000
      },
      units: {
        altitude: "feet",
        barometer: "hpa",
        general_distance: "metric",
        precipitation_measurement: "metric",
        wind_speed: "kts",
        temperature: "celsius"
      }
    },
    metar_api: {
      cacheOutdatedAgeMinutes: 30,
    }
  })

  onMount(async () => {
    // All settings and preferences
    fetchSettings()

    // Get app version
    appVersion = await getVersion()

    // Aircraft
    await refreshAircraft(false)
  })

  async function fetchSettings() {
    try {
      const loadedSettings = await SettingsManager.getAllSettings();
      settings = loadedSettings
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.addToast({
        title: "Error loading settings",
        type: "error"
      });
    }
  }

  async function savePreferences() {
    try {
      if (settings.preferences.table_row_count < 5 || settings.preferences.table_row_count > 25) {
        toast.addToast({
          title: "Table rows must be between 5 & 25",
          type: "error"
        })
        return
      }

      if (settings.preferences.toasts.info_success_duration < 500 || settings.preferences.toasts.info_success_duration > 10000
          || settings.preferences.toasts.error_duration < 500 || settings.preferences.toasts.error_duration > 10000) {
        toast.addToast({
          title: "Autohide Delay must be between 500 and 10000 milliseconds",
          type: "error"
        })
        return
      }

      await SettingsManager.savePreferences(settings.preferences)

      await SettingsManager.saveMetarAPISettings(settings.metar_api)

      toast.addToast({
        title: "Settings Saved",
        type: "success"
      })
    } catch (error) {
      toast.addToast({
        title: "Error when saving preferences & settings",
        type: "error"
      })
    }
  }
  
  async function resetPreferences() {
    try {
  
      await fetchSettings()
  
      toast.addToast({
        title: "Reset Preferences",
        type: "success"
      })
    } catch (error) {
      console.error(error)
    }
  }

  async function setDefault() {
    settings = {
      preferences: {
        table_row_count: 10,
        toasts: {
          info_success_duration: 1500,
          error_duration: 5000
        },
        units: {
          altitude: "feet",
          barometer: "hpa",
          general_distance: "metric",
          precipitation_measurement: "metric",
          wind_speed: "kts",
          temperature: "celsius",
        }
      },
      metar_api: {
        cacheOutdatedAgeMinutes: 30,
      }
    }

    toast.addToast({
      title: "Set to default, save to keep these changes",
      type: "success"
    })
  }

  async function refreshAircraft(doToast=true) {
    await getAircraft()

    if (!doToast) return

    toast.addToast({
      title: "Aircraft Refreshed",
      type: "info"
    })
  }

  // Aircraft management

  async function getAircraft() {
    aircraft = await FlyListDB.getAircraft()
  }

  async function createAircraft() {
    try {
      const result = await FlyListDB.createAircraft(newAircraft)

      await refreshAircraft()

      newAircraft = EMPTY_AIRCRAFT

      if (result) {
        toast.addToast({
          title: "Aircraft Created",
          type: "success"
        })
      } else {
        toast.addToast({
          title: "Failed to create aircraft",
          type: "error"
        })
      }

    } catch (error) {
      console.error(error)
      toast.addToast({
        title: "Error when creating aircraft",
        type: "error"
      })
    }
  }

  function openDeleteAircraftModal(aircraft: Taircraft) {
    deleteAircraft = aircraft
    deleteAircraftModalVisible = true
  }

  async function deleteModalAircraft(aircraft: Taircraft) {
    try {
      await FlyListDB.deleteAircraft(aircraft)

      await refreshAircraft(false)

      toast.addToast({
        title: "Aircraft Deleted",
        type: "success"
      })
      
    } catch (error) {
      console.error(error)
      toast.addToast({
        title: "Failed to delete aircraft",
        type: "error"
      })
    }
  }

  let deleteAircraftModalVisible = $state(false)
  let deleteAircraft: Taircraft | undefined = $state() // The aircraft user may delete

  // Limit aircraft ICAO input to max 4 chars
  $effect(() => {
    if (newAircraft.icao_code.length > 4) {
      newAircraft.icao_code = newAircraft.icao_code.substring(0, 4)
    }
  })

  // Metar Management

  async function cleanupMetarCache() {
    try {
      await MetarManager.cleanupCache()

      toast.addToast({
        title: "Cache cleared",
        type: "success"
      })
    } catch (error) {
      console.error(`Error when attempting to call MetarManager.cleanupCache(): ${error}`)
      toast.addToast({
        title: "Failed to cleanup cache due to an error",
        type: "error"
      })
    }
  }

  async function deleteMetarCache() {
    try {
      await MetarManager.deleteCache()

      await relaunch()

      toast.addToast({
        title: "Deleted METAR cache",
        type: "success"
      })

    } catch (error) {
      console.error(`Error when attempting to call MetarManager.deleteCache(): ${error}`)
      toast.addToast({
        title: "Failed to cleanup cache due to an error",
        type: "error"
      })
    }
  }

</script>

<h2 class="text-2xl text-white font-bold mb-6">Settings</h2>

{#key aircraft}
    <Tabs>
      <TabItem open title="Settings">
        <div class="flex flex-col items-center px-6 max-h-[70vh] overflow-y-auto scrollbar scrollbar-thumb-gray-500 scrollbar-track-transparent">
          <h3 class="text-xl mb-2 font-medium text-gray-200 w-full">General Preferences</h3>

          <div class="flex justify-between items-center w-full">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Table Row Count</h3>
              <p class="text-gray-500 mr-4">Alter the maximum number of rows in each page of a table. Can be between 5 and 25</p>
            </span>
          
            <Input bind:value={settings.preferences.table_row_count} type="number" defaultClass="w-18 font-medium text-lg"/>
          </div>

          <span class="w-full h-[2px] border-b-[1px] rounded border-gray-700 my-4"></span>

          <h3 class="text-xl mb-2 font-medium text-gray-200 w-full">Toasts</h3>

          <div class="flex justify-between items-center w-full">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Info & Success Toast Autohide Delay</h3>
              <p class="text-gray-500 mr-4">Amount of time (in milliseconds) until 'info' and 'success' toasts will be closed. Can be between 500ms and 10000ms</p>
            </span>
            
            <span class="flex gap-2 items-center">
              <Button onclick={async () => {
                // 50/50 on either info or success for test
                if (Math.round(Math.random())) {
                  toast.addToast({
                    title: "Useful information goes here",
                    type: "info"
                  })
                } else {
                  toast.addToast({
                    title: "Wow! Something good happened...",
                    type: "success"
                  })
                }
              }} color="alternative" size="sm" class="h-fit py-1 px-2 mr-1">Test</Button>
              
              <Input bind:value={settings.preferences.toasts.info_success_duration} type="number" defaultClass="w-18 font-medium text-lg"/>
            </span>
          </div>

          
          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Error Toast Autohide Delay</h3>
              <p class="text-gray-500 mr-4">Amount of time (in milliseconds) until 'error' toasts will be closed. Can be between 500ms and 10000ms</p>
            </span>

            <span class="flex gap-2 items-center">
              <Button onclick={async () => {
                toast.addToast({
                  title: "Oh no! Something broke :(",
                  type: "error"
                })
              }} color="alternative" size="sm" class="h-fit py-1 px-2 mr-1">Test</Button>

              <Input bind:value={settings.preferences.toasts.error_duration} type="number" defaultClass="w-18 font-medium text-lg"/>
            </span>
          </div>

          <span class="w-full h-[2px] border-b-[1px] rounded border-gray-700 my-4"></span>

          <h3 class="text-xl mb-2 font-medium text-gray-200 w-full">Unit Preferences</h3>

          <div class="flex justify-between items-center w-full">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Altitudes</h3>
              <p class="text-gray-500 mr-4">Can be either 'feet' or 'meters' (default: 'feet')</p>
            </span>

            <Button color="alternative">
              {settings.preferences.units.altitude}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              <li>
                <Radio name="altitudes" bind:group={settings.preferences.units.altitude} value="feet">Feet</Radio>
              </li>
              <li>
                <Radio name="altitudes" bind:group={settings.preferences.units.altitude} value="meters">Meters</Radio>
              </li>
            </Dropdown>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Barometer</h3>

              <span>
                <p class="text-gray-500 mr-4">Can be either 'hg' (Inches of Mercury), 'hpa' (HectoPascals), 'kpa' (KiloPascals), 'mb' (Millibars)</p>
                <p class="text-gray-500 mr-6 italic">default: <span class="font-medium text-gray-400">hpa</span></p>
              </span>
            </span>

            <Button color="alternative">
              {settings.preferences.units.barometer}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              <li>
                <Radio name="barometric_pressure" bind:group={settings.preferences.units.barometer} value="hg">Inches of Mercury</Radio>
              </li>
              <li>
                <Radio name="barometric_pressure" bind:group={settings.preferences.units.barometer} value="hpa">HectoPascals</Radio>
              </li>
              <li>
                <Radio name="barometric_pressure" bind:group={settings.preferences.units.barometer} value="kpa">KiloPascals</Radio>
              </li>
              <li>
                <Radio name="barometric_pressure" bind:group={settings.preferences.units.barometer} value="mb">Millibars</Radio>
              </li>
            </Dropdown>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Distances</h3>
              <span>
                <p class="text-gray-500 mr-4">Choose between either 'imperial' or 'metric' units</p>
                <p class="text-gray-500 mr-6 italic">default: <span class="font-medium text-gray-400">metric</span></p>
              </span>
            </span>

            <Button color="alternative">
              {settings.preferences.units.general_distance}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              <li>
                <Radio name="general_distance" bind:group={settings.preferences.units.general_distance} value="metric">Metric</Radio>
              </li>
              <li>
                <Radio name="general_distance" bind:group={settings.preferences.units.general_distance} value="imperial">Imperial</Radio>
              </li>
            </Dropdown>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Temperature</h3>
              <span>
                <p class="text-gray-500 mr-4">Choose between 'celsius' or 'fahrenheit'</p>
                <p class="text-gray-500 mr-6 italic">default: <span class="font-medium text-gray-400">celsius</span></p>
              </span>
            </span>

            <Button color="alternative">
              {settings.preferences.units.temperature}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              <li>
                <Radio name="temperature" bind:group={settings.preferences.units.temperature} value="celsius">Celsius</Radio>
              </li>
              <li>
                <Radio name="temperature" bind:group={settings.preferences.units.temperature} value="fahrenheit">Fahrenheit</Radio>
              </li>
            </Dropdown>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Wind Speed</h3>
              <span>
                <p class="text-gray-500 mr-4">Choose between kph (Kilometers per Hour), kts (Knots), mph (Miles per Hour), mps (Meters per Second)</p>
                <p class="text-gray-500 mr-6 italic">default: <span class="font-medium text-gray-400">kts</span></p>
              </span>
            </span>

            <Button color="alternative">
              {settings.preferences.units.wind_speed}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              <li>
                <Radio name="wind_speed" bind:group={settings.preferences.units.wind_speed} value="kph">Kilometers per Hour (kph)</Radio>
              </li>
              <li>
                <Radio name="wind_speed" bind:group={settings.preferences.units.wind_speed} value="kts">Knots (kts)</Radio>
              </li>
              <li>
                <Radio name="wind_speed" bind:group={settings.preferences.units.wind_speed} value="mph">Miles per Hour (mph)</Radio>
              </li>
              <li>
                <Radio name="wind_speed" bind:group={settings.preferences.units.wind_speed} value="mps">Meters per Second (mps)</Radio>
              </li>
            </Dropdown>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Precipitation</h3>
              <span>
                <p class="text-gray-500 mr-4">Measurements of all precipitation (e.g rain, snow). Choose between 'imperial' or 'metric'</p>
                <p class="text-gray-500 mr-6 italic">default: <span class="font-medium text-gray-400">metric</span></p>
              </span>
            </span>

            <Button color="alternative">
              {settings.preferences.units.precipitation_measurement}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              <li>
                <Radio name="precipitation_measurement" bind:group={settings.preferences.units.precipitation_measurement} value="metric">Metric</Radio>
              </li>
              <li>
                <Radio name="precipitation_measurement" bind:group={settings.preferences.units.precipitation_measurement} value="imperial">Imperial</Radio>
              </li>
            </Dropdown>
          </div>


          <span class="w-full h-[2px] border-b-[1px] rounded border-gray-700 my-4"></span>

          <h3 class="text-xl mb-2 font-medium text-gray-200 w-full">CheckWX Metar API Settings</h3>
          
          <div class="flex justify-between items-center w-full">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">API Key</h3>
              <p class="text-gray-500 mr-4">Provide an API Key from <ExternalLink link="https://www.checkwxapi.com/">CheckWX</ExternalLink> to receive METAR information for your airports in expanded view. Do not share this API key with others.</p>
            </span>

            <span class="flex gap-2 items-center">
              <Button onclick={() => {
                showAPIKey = showAPIKey ? false : true
              }} class="px-2 py-2" color="alternative"> <EyeOutline /> </Button>
              <Tooltip>Toggle Visibility</Tooltip>
              <Input bind:value={settings.metar_api.key} type={showAPIKey ? "text" : "password"} defaultClass="w-full font-medium text-lg"/>
            </span>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">METAR Cache Outdated Age</h3>
              <p class="text-gray-500 mr-4">The number of minutes it takes for a cached METAR to be considered 'outdated' and fetch an updated METAR. Can be between 5m and 120m</p>
            </span>

            <Input bind:value={settings.metar_api.cacheOutdatedAgeMinutes} type="number" defaultClass="w-18 font-medium text-lg"/>
          </div>

          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Metar Cache</h3>
              <p class="text-gray-500 mr-4">If something is wrong with your the METAR information being shown, you may want to use these actions to try and resolve the issue.</p>
            </span>

            <span class="flex items-center gap-3 justify-end">
              <Button class="text-nowrap" onclick={() => {deleteMetarCache()}} size="sm" color="alternative"> <TrashBinOutline class="mr-1"/> Delete Cache</Button>
              <Tooltip>Deletes entire cache & restarts app</Tooltip>

              <Button class="text-nowrap" onclick={() => {cleanupMetarCache()}} size="sm" color="alternative"> <CloseOutline class="mr-1"/> Cleanup Cache</Button>
              <Tooltip>Removes all out of date cache entries</Tooltip>
            </span>
          </div>
          
        </div>

        <span class="flex gap-4 justify-end w-full mt-4">
          <Button onclick={async () => {await setDefault()}} color="alternative">Set to Default</Button>
          <Button onclick={async () => {await resetPreferences()}} color="alternative"> <ArrowsRepeatOutline/> Reset</Button>
          <Button onclick={async () => {await savePreferences()}}> <FloppyDiskOutline /> Save</Button>
        </span>
          
      </TabItem>

      <TabItem title="Aircraft">
        <p class="mt-1 mb-4 font-normal text-gray-500 dark:text-gray-400">View and add new aircraft to your flylist. These aircraft are used when creating a new flight.</p>
        <Table items={aircraft} striped={true}>
          <TableHead>
            <TableHeadCell>NAME</TableHeadCell>
            <TableHeadCell>MODEL</TableHeadCell>
            <TableHeadCell>MANUFACTURER</TableHeadCell>
            <TableHeadCell>ICAO</TableHeadCell>
            <TableHeadCell>CREATED AT</TableHeadCell>
            <TableHeadCell></TableHeadCell>
          </TableHead>
          
          {#if aircraft.length > 0}
            <TableBody tableBodyClass="divide-y">
              <TableBodyRow slot="row" let:item>
                <TableBodyCell>{item.name}</TableBodyCell>
                <TableBodyCell>{item.model}</TableBodyCell>
                <TableBodyCell>{item.manufacturer}</TableBodyCell>
                <TableBodyCell>{item.icao_code}</TableBodyCell>
                <TableBodyCell>{formatDate(new Date(item.created_at))}</TableBodyCell>
                <TableBodyCell> <Button onclick={() => {openDeleteAircraftModal(item)}} color="alternative" > <FireOutline color="red" /> </Button> </TableBodyCell>
              </TableBodyRow>
            </TableBody>
          {:else}
            <TableBodyRow>
              <TableBodyCell colspan={7} class="text-center"><span class="text-gray-400 italic">No aircraft found, create one below</span></TableBodyCell>
            </TableBodyRow>
          {/if}

          
          <TableBodyRow>
            <TableBodyCell >
              <Input bind:value={newAircraft.name} placeholder="Name" class="w-24" />
            </TableBodyCell>
            <TableBodyCell >
              <Input bind:value={newAircraft.model} placeholder="Model" class="w-24" />
            </TableBodyCell>
            <TableBodyCell >
              <Input bind:value={newAircraft.manufacturer} placeholder="Manufacturer" class="w-32" />
            </TableBodyCell>
            <TableBodyCell >
              <Input bind:value={newAircraft.icao_code} placeholder="ICAO" class="w-16" />
            </TableBodyCell>
            <TableBodyCell >
              <Button onclick={createAircraft}> <PlusOutline />  Add Aircraft</Button>
            </TableBodyCell>
          </TableBodyRow>
        </Table>
      </TabItem>

      <TabItem open title="Information">

        <p class="text-gray-300 mb-2">
          Created by me, <ExternalLink link="https://jakepazzard.dev" >Jake Pazzard</ExternalLink>,
          using <ExternalLink style="alternative" link="https://svelte.dev/">Svelte</ExternalLink>,
          <ExternalLink style="alternative" link="https://tauri.app/">Tauri</ExternalLink>,
          <ExternalLink style="alternative" link="https://flowbite-svelte.com/">Flowbite Svelte</ExternalLink>
           & <ExternalLink style="alternative" link="https://hugeicons.com/">Hugeicons</ExternalLink>.
        </p>
        
        <h3 class="text-xl font-medium text-gray-200 w-full mt-2">Report an Issue</h3>
        <p class="text-gray-300 mb-2">Found an issue? Report it to <ExternalLink link="mailto:contact@jakepazzard.dev">contact@jakepazzard.dev</ExternalLink>. I'm also open to feature suggestions!</p>
          
        <h3 class="text-xl font-medium text-gray-200 w-full mt-4">Data</h3>
        <p class="text-gray-300 ">All data is stored locally on your device. Some data is stored and/or fetched from</p>
        <List list="none" class="pl-8">
          <Li><ExternalLink class="text-gray-200" style="alternative" link="https://ourairports.com/data/">OurAirports (airports)</ExternalLink></Li>
          <Li><ExternalLink class="text-gray-200" style="alternative" link="https://openflights.org/data.php#airline">OpenFlights (airlines)</ExternalLink></Li>
          <Li><ExternalLink class="text-gray-200" style="alternative" link="https://www.checkwxapi.com/">CheckWX API (metar)</ExternalLink></Li>
        </List>

        <h3 class="text-xl font-medium text-gray-200 w-full mt-4">Licensing</h3>
        <p class="text-gray-300">Licensed under <ExternalLink link="https://www.gnu.org/licenses/agpl-3.0.en.html">AGPL v3</ExternalLink>. Find the source code at <ExternalLink link="https://github.com/JakePazz/flylist">https://github.com/JakePazz/flylist</ExternalLink>.</p>
        <div class="flex flex-col gap-2 my-4 text-gray-400 max-w-[600px]">
          <p>
            This program is free software: you can redistribute it and/or modify
            it under the terms of the GNU Affero General Public License as
            published by the Free Software Foundation, either version 3 of the
            License, or any later version.
          </p>
          <p>
            This program is distributed in the hope that it will be useful,
            but WITHOUT ANY WARRANTY; without even the implied warranty of
            MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
            GNU Affero General Public License for more details.
          </p>
          <p>
            You should have received a copy of the GNU Affero General Public License
            along with this program.  If not, see <ExternalLink style="alternative" link="https://www.gnu.org/licenses/">https://www.gnu.org/licenses/</ExternalLink>
          </p>
        </div>
        <span class="flex gap-3 justify-between items-center mt-4">
          <p class="text-gray-200 font-medium">Copyright &copy; 2025  Jake Pazzard</p>
          <p class="text-gray-400 italic font-medium">FlyList Version: {appVersion}</p>
        </span>
        
      </TabItem>
    </Tabs>
{/key}

<Modal title="Are you Sure?" bind:open={deleteAircraftModalVisible} size="xs" autoclose>
    
    <p>If you delete this aircraft, all flights using it will also be deleted.</p>
    <!--  -->
    {#if deleteAircraft}
      <div class="flex  gap-6 flex-wrap justify-between">
        <span>
          <Label>Name</Label>
          <p>{deleteAircraft.name}</p>
        </span>

        <span>
          <Label>Model</Label>
          <p>{deleteAircraft.model}</p>
        </span>

        <span>
          <Label>ICAO</Label>
          <p>{deleteAircraft.icao_code}</p>
        </span>
          
        <span>
          <Label>Manufacturer</Label>
          <p>{deleteAircraft.manufacturer}</p>
        </span>
      </div>
    {/if}

    <p class="font-medium text-sm text-red-400 italic">This action cannot be undone</p>
    <Button onclick={() => {
      if (!deleteAircraft) return
      deleteModalAircraft(deleteAircraft)
    }} class="me-2">Yes</Button>
    <Button color="alternative">Cancel</Button>
</Modal>
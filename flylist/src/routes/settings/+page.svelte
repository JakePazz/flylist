<script lang="ts">
  import { FlyListDB } from "$lib/db/database";
  import { formatDate } from "$lib/functions/formatDate";
  import { getToast } from "$lib/stores/toast.svelte";
  import { type Taircraft } from "$lib/types/aircraft";
  import type { Tpreferences } from "$lib/types/preferences";
  import { LazyStore, load } from "@tauri-apps/plugin-store";
  import { Button, Dropdown, DropdownItem, Input, Label, TabItem, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tabs } from "flowbite-svelte";
  import { ArchiveOutline, ArrowsRepeatOutline, DotsHorizontalOutline, FireOutline, FloppyDiskOutline, PlusOutline, TrashBinOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  
  const toast = getToast()

  // const settings = ["table_row_count", "info_success_duration", "error_duration"]
  // User Preferences, init with default values
  let preferences: Tpreferences | undefined = $state()

  let tableRowCount = $state(10)
  let infoSuccessDuration = $state(1500)
  let errorDuration = $state(5000)
  let aircraft = $state<Taircraft[]>([])

  let newAircraft = $state<Taircraft>({
    id: 0,
    icao_code: "",
    manufacturer: "",
    model: "",
    name: "",
  })

  onMount(async () => {
    // Preferences
    fetchPreferences()
    

    // Aircraft
    await refreshAircraft(false)
  })

  async function fetchPreferences() {
    
    const settings = await load("settings.json")
    preferences = await settings.get<Tpreferences>("preferences")
    console.log($state.snapshot(preferences))

    const storedTableRowCount = preferences?.table_row_count
    if (storedTableRowCount) { tableRowCount = Number(storedTableRowCount) }

    const storedInfoSuccessDuration = preferences?.info_success_duration
    if (storedInfoSuccessDuration) { infoSuccessDuration = Number(storedInfoSuccessDuration) }

    const storedErrorDuration = preferences?.error_duration
    if (storedErrorDuration) { errorDuration = Number(storedErrorDuration) }
    
  }

  async function savePreferences() {
    try {
      if (tableRowCount < 5 || tableRowCount > 25) {
        await toast.addToast({
          title: "Table rows must be between 5 & 25",
          type: "error"
        })
      }

      if (infoSuccessDuration < 500 || infoSuccessDuration > 10000 || errorDuration < 500 || errorDuration > 10000) {
        await toast.addToast({
          title: "Autohide Delay must be between 500 and 10000 milliseconds",
          type: "error"
        })
      }

      const settings = await load("settings.json")

      const newSettings: Tpreferences = {
        error_duration: errorDuration,
        info_success_duration: infoSuccessDuration,
        table_row_count: tableRowCount,
      }
      
      settings.set("preferences", newSettings)

      await settings.save()

      await toast.addToast({
        title: "Preferences Saved",
        type: "success"
      })
    } catch (error) {
      await toast.addToast({
        title: "Error when saving preferences",
        type: "error"
      })
    }
  }
  
  async function resetPreferences() {
    try {
      // Reset to defaults
      tableRowCount = 10
      infoSuccessDuration = 1500
      errorDuration = 5000
  
      await fetchPreferences()
  
      await toast.addToast({
        title: "Reset Preferences",
        type: "success"
      })
    } catch (error) {
      console.error(error)
    }
  }

  async function setDefault() {

    // Set to default values
    tableRowCount = 10
    infoSuccessDuration = 1500
    errorDuration = 5000

    await toast.addToast({
      title: "Set to default, save to keep these changes",
      type: "success"
    })
  }

  async function refreshAircraft(doToast=true) {
    await getAircraft()

    if (!doToast) return

    await toast.addToast({
      title: "Aircraft Refreshed",
      type: "info"
    })
  }


  // Aircraft
  async function getAircraft() {
    aircraft = await FlyListDB.getAircraft()

  }

  async function createAircraft() {
    try {
      const result = await FlyListDB.createAircraft(newAircraft)

      await refreshAircraft()

      if (result) {
        await toast.addToast({
          title: "Aircraft Created",
          type: "success"
        })
      } else {
        await toast.addToast({
          title: "Failed to create aircraft",
          type: "error"
        })
      }

    } catch (error) {
      console.error(error)
      await toast.addToast({
        title: "Error when creating aircraft",
        type: "error"
      })
    }
  }

  async function deleteAircraft(aircraft: Taircraft) {
    try {
      await FlyListDB.deleteAircraft(aircraft)

      await refreshAircraft(false)

      await toast.addToast({
        title: "Aircraft Deleted",
        type: "success"
      })

      // TODO: Add confirmation modal and make sure user knows that it will also delete all flights using this aircraft

      
    } catch (error) {
      console.error(error)
    }
  }

</script>

<h2 class="text-2xl text-white font-bold mb-6">Settings</h2>

{#key aircraft}
    <Tabs>
      <TabItem open title="Preferences">
        <div class="flex flex-col items-center px-6">

          <div class="flex justify-between items-center w-full">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Table Row Count</h3>
              <p class="text-gray-500 mr-4">Alter the maximum number of rows in each page of a table. Can be between 5 and 25</p>
            </span>
          
            <Input bind:value={tableRowCount} type="number" defaultClass="w-18 font-medium text-lg"/>
          </div>

          <span class="w-full h-[2px] border-b-[1px] rounded border-gray-700 my-4"></span>

          <div class="flex justify-between items-center w-full">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Info & Success Toast Autohide Delay</h3>
              <p class="text-gray-500 mr-4">Amount of time (in milliseconds) until 'info' and 'success' toasts will be closed. Can be between 500ms and 10000ms</p>
            </span>
            
            <span class="flex gap-2 items-center">
              <Button onclick={async () => {
                // 50/50 on either info or success for test
                if (Math.round(Math.random())) {
                  await toast.addToast({
                  title: "Useful information goes here",
                  type: "info"
                })
                } else {
                  await toast.addToast({
                    title: "Wow! Something good happened...",
                    type: "success"
                  })
                }
              }} color="alternative" size="sm" class="h-fit py-1 px-2 mr-1">Test</Button>
              
              <Input bind:value={infoSuccessDuration} type="number" defaultClass="w-18 font-medium text-lg"/>
            </span>
          </div>

          
          <div class="flex justify-between items-center w-full mt-6">
            <span class="flex flex-col gap-2 ">
              <h3 class="text-white mr-6">Error Toast Autohide Delay</h3>
              <p class="text-gray-500 mr-4">Amount of time (in milliseconds) until 'error' toasts will be closed. Can be between 500ms and 10000ms</p>
            </span>

            <span class="flex gap-2 items-center">
              <Button onclick={async () => {
                await toast.addToast({
                  title: "Oh no! Something broke :(",
                  type: "error"
                })
              }} color="alternative" size="sm" class="h-fit py-1 px-2 mr-1">Test</Button>

              <Input bind:value={errorDuration} type="number" defaultClass="w-18 font-medium text-lg"/>
            </span>
          </div>

          <span class="w-full h-[2px] border-b-[1px] rounded border-gray-700 my-4"></span>

          <span class="flex gap-4 justify-end w-full">
            <Button onclick={async () => {await setDefault()}} color="alternative">Set to Default</Button>
            <Button onclick={async () => {await resetPreferences()}} color="alternative"> <ArrowsRepeatOutline/> Reset</Button>
            <Button onclick={async () => {await savePreferences()}}> <FloppyDiskOutline /> Save</Button>
          </span>
          
        </div>
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
                <TableBodyCell> <Button onclick={() => {deleteAircraft(item)}} color="alternative" > <FireOutline color="red" /> </Button> </TableBodyCell>
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

    </Tabs>
{/key}
<script lang="ts">
  import { FlyListDB } from "$lib/db/database";
  import type { Tflight } from "$lib/types/flight";
  import { Button, Dropdown, DropdownDivider, DropdownItem, Input, Label, Modal, Pagination, Popover, Radio, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip } from "flowbite-svelte";
  import { ArchiveOutline, ChevronDownOutline, ChevronLeftOutline, ChevronRightOutline, CirclePlusOutline, DotsHorizontalOutline, EditOutline, FireOutline, FloppyDiskOutline, RefreshOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import { getToast } from "$lib/stores/toast.svelte";
  import { convertMinutes } from "$lib/functions/formatDuration";
  import { formatDate } from "$lib/functions/formatDate";
  import { load } from "@tauri-apps/plugin-store";
  import type { Tpreferences } from "$lib/types/preferences";
  import type { NumericRange } from "@sveltejs/kit";
  import type { Taircraft } from "$lib/types/aircraft";
  import { openFlightradar } from "$lib/functions/openFlightradar";
  
  let flights: Tflight[] = $state([])
  let currentPageFlights: Tflight[] = $state([])
  let pages: { name: string, active: boolean }[] = $state([])
  let tableRowCount: number = $state(10)
  
  const toast = getToast()

  onMount(async () => {
    await refreshFlights(false)

    // Get preferences for toast duration before autohide
    const settings = await load("settings.json");
    const preferences = await settings.get<Tpreferences>("preferences");
    tableRowCount = preferences?.table_row_count || 10


    // Get aircraft and default dropdown to first one in array
    aircrafts = await FlyListDB.getAircraft()
  })

  async function loadData() {
    flights = await FlyListDB.getFlights()
    flights = flights.filter((flight) => flight.archived === false)

    flights.forEach(async (flight, index) => {
      const depAirport = await FlyListDB.getAirport(flight.route.dep_airport)
      const arrAirport = await FlyListDB.getAirport(flight.route.arr_airport)

      // If no data for either, do not add
      if (!depAirport || !arrAirport) return

      flights[index].complete_route = {
        arr_airport: arrAirport,
        dep_airport: depAirport
      }
    })

    pages = []

    const pageCount = Math.ceil(flights.length / tableRowCount)

    for (let i = 0; i < pageCount; i++) {
      pages.push({ name: String(i + 1), active: false })
    }

    if (pages.length > 0) {
      pages[0].active = true
    }

  }

  async function refreshFlights(doToast=true) {
    await loadData()
    await loadPage()

    if (!doToast) return

    await toast.addToast({
      title: "Flights Refreshed",
      type: "info"
    })
  }

  // Pagination
  async function loadPage() {
    const selectedPage = pages.find((page) => page.active === true)

    const start = (Number(selectedPage?.name) * tableRowCount) - tableRowCount
    const end = (Number(selectedPage?.name) * tableRowCount)

    currentPageFlights = flights.slice(start, end)
  }

  const previous = async () => {
    const pageIndex = pages.findIndex((page) => page.active === true)

    if (pageIndex <= 0) {
      return
    }

    pages[pageIndex].active = false
    pages[pageIndex - 1].active = true

    await loadPage()
  };

  const next = async () => {
    const pageIndex = pages.findIndex((page) => page.active === true)

    if (pageIndex >= pages.length - 1) {
      return
    }

    pages[pageIndex].active = false
    pages[pageIndex + 1].active = true

    await loadPage()
  };

  const pageClick = async (page: number) => {
    
    // Set all pages to inactive
    pages.forEach((_, i) => {
      pages[i].active = false
    })

    // Set selected page to active
    pages[page - 1].active = true

    await loadPage()
  }

  // Menu Options
  async function editFlight(flight: Tflight, updated: Tflight) {

    try {
      const result = await FlyListDB.editFlight(flight, updated)

      if (result) {
        await toast.addToast({
          title: `Saved Changes to #${flight.id}`,
          type: "success"
        })
      } else {
        await toast.addToast({
          title: `Failed to save changes to #${flight.id}`,
          type: "error"
        })
      }

      editModal = false
      await refreshFlights(false) 
    } catch (error) {
      console.error(error)
    }
  }

  async function openEditModal(flight: Tflight) {
    await refreshFlights(false) // Forces dropdown to close

    editModalHours = Math.floor(flight.duration / 60)
    editModalMinutes = flight.duration % 60

    editModalFlight = flight
    editModalContent = JSON.parse(JSON.stringify(flight)) // Using JSON. will create deep copy
    editModal = true
  }

  $effect(() => {
    if (editModalContent?.duration) {
      editModalContent.duration = (editModalHours * 60) + editModalMinutes
    }
  })

  async function deleteFlight(flight: Tflight) {
    try {
      await FlyListDB.deleteFlight(flight)

      await refreshFlights(false)

      await toast.addToast({
        title: `Flight deleted`,
        type: "success"
      })
    } catch (error) {
      await toast.addToast({
        title: `Failed to delete flight`,
        type: "error"
      })
    }
  }

  async function archiveFlight(flight: Tflight) {
    try {
      await FlyListDB.toggleArchiveFlight(flight)

      await refreshFlights(false)

      await toast.addToast({
        title: `Flight Archived`,
        type: "success"
      })
    } catch (error) {
      await toast.addToast({
        title: `Failed to archive flight`,
        type: "error"
      })
    }
  }

  // Edit Modal
  let editModal = $state(false)
  let editModalContent: Tflight | undefined = $state()
  let editModalFlight: Tflight | undefined = $state()
  let editModalHours: number = $state(0);
  let editModalMinutes: number = $state(0);

  let aircrafts: Taircraft[] = $state([])
  let aircraftGroup = $state(1);

  // Update aircraft based upon dropdown changes `aircraftGroup`
  $effect(() => { 
    const ac = aircrafts.find((ac) => ac.id === aircraftGroup)
    if (!ac) return

    if (!editModalContent) return

    editModalContent.aircraft = ac
  })

</script>

<div class="flex justify-between items-center mb-6">
  <h2 class="text-2xl text-white font-bold">Your Flights</h2>
  <Button aria-label="Refresh Flights" onclick={() => {refreshFlights()}} size="sm" color="alternative" > <RefreshOutline /></Button>
</div>

{#if flights.length > 0}
  {#key currentPageFlights}
    <Table  items={currentPageFlights} shadow divClass="relative overflow-x-auto scrollbar scrollbar-thumb-gray-500 scrollbar-track-transparent">
      <TableHead>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.id - b.id} defaultDirection="asc">ID</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.route.dep_airport.localeCompare(b.route.dep_airport)}>DEP</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.route.arr_airport.localeCompare(b.route.arr_airport)}>ARR</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.company.callsign.localeCompare(b.company.callsign)}>CALLSIGN</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.company.fl_no.localeCompare(b.company.fl_no)}>FL NO.</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.aircraft.name.localeCompare(b.aircraft.name)}>AIRCRAFT</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.duration - b.duration }>DURATION</TableHeadCell>
        <TableHeadCell>ACTIONS</TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y ">
        <TableBodyRow slot="row" let:item>
          <TableBodyCell><span class="text-gray-400 italic">{item.id}</span></TableBodyCell>
          <TableBodyCell><span id="dep-airport-{item.id}">{item.route.dep_airport}</span></TableBodyCell>
          <TableBodyCell><span id="arr-airport-{item.id}">{item.route.arr_airport}</span></TableBodyCell>
          <TableBodyCell>{item.company.callsign}</TableBodyCell>
          <TableBodyCell> <Button class="px-2 py-0.5 hover:cursor-pointer" onclick={async () => { await openFlightradar(item.company.airline_icao, item.company.fl_no) }} color="alternative" >{item.company.fl_no}</Button> </TableBodyCell>
          <TableBodyCell>{item.aircraft.name}</TableBodyCell>
          <TableBodyCell>{convertMinutes(item.duration)}</TableBodyCell>
          <TableBodyCell>
            <DotsHorizontalOutline class="dots-menu-{item.id} dark:text-white" />
            <Dropdown triggeredBy=".dots-menu-{item.id}">
              <div slot="header" class="px-4 py-2 flex flex-col">
                <span class="text-sm text-gray-400 italic flex items-center justify-between">Last Edited <EditOutline class="w-4 h-4" /></span>
                <span>{formatDate(new Date(item.last_edited))}</span>
                <span class="text-sm text-gray-400 italic flex items-center justify-between">Created At <CirclePlusOutline class="w-4 h-4" /></span>
                <span>{formatDate(new Date(item.created_at))}</span>
              </div>
              <DropdownItem onclick={async () => {await openEditModal(item)}} class="flex gap-2"> <EditOutline /> Edit</DropdownItem>
              <DropdownItem onclick={async () => {await archiveFlight(item)}} class="flex gap-2"> <ArchiveOutline/> Archive</DropdownItem>
              <DropdownDivider />
              <DropdownItem onclick={async () => {await deleteFlight(item)}} class="flex gap-2"> <FireOutline color="red" /> Delete</DropdownItem>
            </Dropdown>
          </TableBodyCell>
          <Popover placement="left" triggeredBy="#arr-airport-{item.id}">{item.complete_route ? item.complete_route.arr_airport.name : "Not Available"}</Popover>
          <Popover placement="left" triggeredBy="#dep-airport-{item.id}">{item.complete_route ? item.complete_route.dep_airport.name : "Not Available"}</Popover>
        </TableBodyRow>
      </TableBody>
    </Table>


    <!-- Occupy blank space to push btns and pagination to bottom of page -->
    <span class="flex-1"></span>

    <span class="flex flex-col gap-3 items-center justify-center mx-auto mt-6">
      <Pagination {pages} on:previous={previous} on:next={next} on:click={(event) => {pageClick(Number((event.target as HTMLElement).innerText))}}>
        <svelte:fragment slot="prev">
          <span class="sr-only">Previous</span>
          <ChevronLeftOutline class="w-6 h-6" />
        </svelte:fragment>
        <svelte:fragment slot="next">
          <span class="sr-only">Next</span>
          <ChevronRightOutline class="w-6 h-6" />
        </svelte:fragment>
      </Pagination>

    </span>

  {/key}
{:else}
  <div class="flex-1 flex justify-center items-center flex-col gap-3">
    <h2 class="tet-lg italic font-medium text-gray-600">No existing flights found</h2>
    <Button href="/flights/create" size="sm">Create a Flight</Button>
  </div>
{/if}

<Modal open={editModal} on:close={() => {editModal = false}}>
  {#if editModalContent && editModalFlight}
    <form class="flex flex-col gap-2">
      <h4 class="text-xl font-medium text-white flex items-center">Edit Flight #{editModalContent.id}</h4>
      <p class="text-gray-500 ">Update details of this existing flight.</p>

      <div class="flex gap-6">
        <span class="flex-1">
          <Label>Departure Airport</Label>
          <Input bind:value={editModalContent.route.dep_airport}/>
        </span>
        
        <span class="flex-1">
          <Label>Arrival Airport</Label>
          <Input bind:value={editModalContent.route.arr_airport}/>
        </span>
      </div>
  
      <div class="flex gap-6">
        <span class="flex-1">
          <Label>Flight Number</Label>
          <Input bind:value={editModalContent.company.fl_no}/>
        </span>
        
        <span class="flex-1">
          <Label>Callsign</Label>
          <Input bind:value={editModalContent.company.callsign}/>
        </span>
      </div>
  
      <div class="flex gap-6 ">
        <span class="flex-4">
          <Label>Aircraft Type</Label>
          {#key aircraftGroup}
            <Button color="alternative" class="w-max">
              {aircrafts.find((ac) => ac.id === aircraftGroup)?.name || "Select Aircraft"} <ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              {#each aircrafts as aircraft}
              <li class="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                <Radio name="Aircraft Type" bind:group={aircraftGroup} value={aircraft.id}>{aircraft.name}</Radio>
              </li>
              {/each}
            </Dropdown>
          {/key}
        </span>
  
        
        <span class="flex-1">
          <Label>Hours</Label>
          <Input type="number" bind:value={editModalHours}/>
        </span>
        
        <span class="flex-1">
          <Label>Minutes</Label>
          <Input type="number" bind:value={editModalMinutes}/>
        </span>
      </div>
  
      <Button onclick={() => {
        if (editModalContent && editModalFlight) {
          console.log("IN BTN")
          console.log(editModalContent)
          console.log(editModalFlight)
          editFlight(editModalFlight, editModalContent)
        }
      }}><FloppyDiskOutline class="w-5 h-5 me-2" /> Save Changes</Button>  
    </form>
  {/if}
  
</Modal>
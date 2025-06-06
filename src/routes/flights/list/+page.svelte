<script lang="ts">
  import { FlyListDB } from "$lib/managers/database";
  import type { Tflight } from "$lib/types/flight";
  import { Button, Card, Dropdown, DropdownDivider, DropdownItem, Input, Label, Modal, P, Pagination, Popover, Radio, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Tooltip } from "flowbite-svelte";
  import { AngleLeftOutline, ArchiveOutline, ChevronDownOutline, ChevronLeftOutline, ChevronRightOutline, CirclePlusOutline, DotsHorizontalOutline, EditOutline, FireOutline, FloppyDiskOutline, GlobeOutline, MapPinAltOutline, RefreshOutline, UserHeadsetOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import { getToast } from "$lib/stores/toast.svelte";
  import { formatDuration } from "$lib/functions/formatDuration";
  import { formatDate } from "$lib/functions/formatDate";
  import { load } from "@tauri-apps/plugin-store";
  import type { Tpreferences } from "$lib/types/preferences";
  import type { Taircraft } from "$lib/types/aircraft";
  import { openFlightradar } from "$lib/functions/openFlightradar";
  import { fly } from "svelte/transition";
  import { openInSimbrief } from "$lib/functions/openInSimbrief";
  import AirportCard from "$lib/components/AirportCard.svelte";
  import AirplaneSeat from "$lib/assets/hugeicons/AirplaneSeat.svg";
  
  let flights: Tflight[] = $state([])
  let currentPageFlights: Tflight[] = $state([])
  let pages: { name: string, active: boolean }[] = $state([])
  let tableRowCount: number = $state(10)
  
  const toast = getToast()

  onMount(async () => {
    await refreshFlights(false)

    // Get preferences for toast duration before autohide
    const settings = await load("settings.json")
    const preferences = await settings.get<Tpreferences>("preferences")
    tableRowCount = preferences?.table_row_count || 10

    // Get aircraft and default dropdown to first one in array
    aircrafts = await FlyListDB.getAircraft()
  })

  async function loadData() {
    flights = await FlyListDB.getFlights()
    flights = flights.filter((flight) => flight.archived === false)

    const flightsToUpdate = [...flights]

    // Process each flight's airport data
    for (let i = 0; i < flightsToUpdate.length; i++) {
      try {
        const flight = flightsToUpdate[i]
        const depAirport = await FlyListDB.getAirport(flight.route.dep_airport)
        const arrAirport = await FlyListDB.getAirport(flight.route.arr_airport)
        
        // If no data for either skip
        if (!depAirport || !arrAirport) continue
        
        // Update the flight with its airport data
        flights[i].complete_route = {
          arr_airport: arrAirport,
          dep_airport: depAirport
        }
      } catch (error) {
        console.error(`Error loading airport data for flight ${i+1}:`, error)
        toast.addToast({
          title: `Error loading airport data for flight ${i+1}: ${error}`,
          type: "error"
        })
      }
    }

    // Create pages to be used by <Pagination>
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

    toast.addToast({
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

  // Pagination previous btn
  const previous = async () => {
    const pageIndex = pages.findIndex((page) => page.active === true)

    if (pageIndex <= 0) {
      return
    }

    pages[pageIndex].active = false
    pages[pageIndex - 1].active = true

    await loadPage()
  };

  // Pagination next btn
  const next = async () => {
    const pageIndex = pages.findIndex((page) => page.active === true)

    if (pageIndex >= pages.length - 1) {
      return
    }

    pages[pageIndex].active = false
    pages[pageIndex + 1].active = true

    await loadPage()
  };

  // Pagination skip to selected page
  const pageClick = async (page: number) => {
    
    // Set all pages to inactive
    pages.forEach((_, i) => {
      pages[i].active = false
    })

    // Set selected page to active
    pages[page - 1].active = true

    await loadPage()
  }

  // Menu Options (editFlight, deleteFlight, openEditModal, archiveFlight)

  async function editFlight(flight: Tflight, updated: Tflight) {

    try {
      const result = await FlyListDB.editFlight(flight, updated)

      if (result) {
        toast.addToast({
          title: `Saved Changes to #${flight.id}`,
          type: "success"
        })
      } else {
        console.error(`Failed to save changes to #${flight.id}`)
        toast.addToast({
          title: `Failed to save changes to #${flight.id}`,
          type: "error"
        })
      }

      editModal = false
      await refreshFlights(false) 
    } catch (error) {
      console.error(error)
      toast.addToast({
        title: "Error when saving edits to flight",
        type: "error"
      })
    }
  }

  async function openEditModal(flight: Tflight) {
    await refreshFlights(false) // Forces dropdown to close

    editModalHours = Math.floor(flight.duration / 60)
    editModalMinutes = flight.duration % 60

    editModalFlight = flight
    editModalContent = JSON.parse(JSON.stringify(flight)) // Will create deep copy
    editModal = true
  }

  // Update edit modal duration value to reflect hours and minutes input
  $effect(() => {
    if (editModalContent?.duration) {
      editModalContent.duration = (editModalHours * 60) + editModalMinutes
    }
  })

  async function deleteFlight(flight: Tflight) {
    try {
      await FlyListDB.deleteFlight(flight)

      await refreshFlights(false)

      toast.addToast({
        title: `Flight deleted`,
        type: "success"
      })
    } catch (error) {
      toast.addToast({
        title: `Failed to delete flight`,
        type: "error"
      })
    }
  }

  async function archiveFlight(flight: Tflight) {
    try {
      await FlyListDB.toggleArchiveFlight(flight)

      await refreshFlights(false)

      toast.addToast({
        title: `Flight Archived`,
        type: "success"
      })
    } catch (error) {
      toast.addToast({
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

  // Row Expansion
  let showExpandedSection: boolean = $state(false)
  let expandedFlight: Tflight | undefined = $derived(flights[0])

  const expandRow = (id: number) => {
    expandedFlight = flights.find((flight) => flight.id === id)

    showExpandedSection = true
  }

  // Wrapper for column sorting to force popover refresh
  function createSortFunction(sortFn: (a: Tflight, b: Tflight) => number) {
    return function(a: Tflight, b: Tflight) {
      refreshCounter += 1
      return sortFn(a, b)
    }
  }

  let refreshCounter = $state(0)
</script>


<div class="flex-1 flex justify-between flex-row overflow-hidden">
  <div class="flex-3 flex flex-col overflow-hidden min-w-0">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl text-white font-bold">Your Flights</h2>
      <span class="flex gap-4">
        <Button aria-label="Refresh Flights" onclick={() => {refreshFlights()}} size="sm" color="alternative" > <RefreshOutline /></Button>
        <Button aria-label="Refresh Flights" onclick={() => {showExpandedSection = showExpandedSection ? false : true}} size="sm" color="alternative" >
          <AngleLeftOutline class={`transition-all duration-300 ${showExpandedSection ? "rotate-180" : ""}`} />
        </Button>
      </span>
    </div>

    {#if flights.length > 0}
      {#key currentPageFlights}
        <Table items={currentPageFlights} shadow divClass="relative overflow-x-auto scrollbar scrollbar-thumb-gray-500 scrollbar-track-transparent">
          <TableHead>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.id - b.id)} defaultDirection="asc">ID</TableHeadCell>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.route.dep_airport.localeCompare(b.route.dep_airport))}>DEP</TableHeadCell>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.route.arr_airport.localeCompare(b.route.arr_airport))}>ARR</TableHeadCell>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.company.callsign.localeCompare(b.company.callsign))}>CALLSIGN</TableHeadCell>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.company.fl_no.localeCompare(b.company.fl_no))}>FL NO.</TableHeadCell>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.aircraft.name.localeCompare(b.aircraft.name))}>AIRCRAFT</TableHeadCell>
            <TableHeadCell sort={createSortFunction((a: Tflight, b: Tflight) => a.duration - b.duration)}>DURATION</TableHeadCell>
            <TableHeadCell>ACTIONS</TableHeadCell>
          </TableHead>
          <TableBody tableBodyClass="divide-y ">
            <TableBodyRow slot="row" ondblclick={() => expandRow(item.id)} let:item>
              <TableBodyCell><span class="text-gray-400 italic">{item.id}</span></TableBodyCell>
              <TableBodyCell><span id="dep-airport-{item.id}">{item.route.dep_airport}</span></TableBodyCell>
              <TableBodyCell><span id="arr-airport-{item.id}">{item.route.arr_airport}</span></TableBodyCell>
              <TableBodyCell>{item.company.callsign}</TableBodyCell>
              <TableBodyCell><Button class="px-2 py-0.5 hover:cursor-pointer" onclick={async () => { await openFlightradar(item.company.airline_icao, item.company.fl_no) }} color="alternative" >{item.company.fl_no}</Button></TableBodyCell>
              <TableBodyCell><span id="aircraft-name-{item.id}">{item.aircraft.name}</span></TableBodyCell>
              <TableBodyCell>{formatDuration(item.duration)}</TableBodyCell>
              <TableBodyCell><DotsHorizontalOutline class="dots-menu-{item.id} dark:text-white"/></TableBodyCell>
            </TableBodyRow>
          </TableBody>
        </Table>

        <!-- Create page's popover elements for each flight -->
        {#key refreshCounter}
        {#key currentPageFlights}
          {#each currentPageFlights as flight}
          <Popover placement="left" triggeredBy="#arr-airport-{flight.id}">{flight.complete_route ? flight.complete_route.arr_airport.name : "Not Available"}</Popover>
          <Popover placement="left" triggeredBy="#dep-airport-{flight.id}">{flight.complete_route ? flight.complete_route.dep_airport.name : "Not Available"}</Popover>
          
          <Popover placement="right" triggeredBy="#aircraft-name-{flight.id}" title={flight.aircraft.name}>
            <div class="flex gap-4">
              <span>
                <Label class="font-medium !text-gray-500 italic">Model</Label>
                <p class="font-medium text-gray-300">{flight.aircraft.model}</p>
              </span>
              <span>
                <Label class="font-medium !text-gray-500 italic">ICAO</Label>
                <p class="font-medium text-gray-300">{flight.aircraft.icao_code}</p>
              </span>
            </div>
            <Label class="font-medium !text-gray-500 italic">Manufacturer</Label>
            <p class="font-medium text-gray-300">{flight.aircraft.manufacturer}</p>
          </Popover>
          
          <Dropdown placement="bottom" triggeredBy=".dots-menu-{flight.id}">
            <div slot="header" class="px-4 py-2 flex flex-col">
              <span class="text-sm text-gray-400 font-medium italic flex items-center justify-between">Last Edited <EditOutline class="w-4 h-4" /></span>
              <span class="text-sm text-gray-300">{formatDate(new Date(flight.last_edited))}</span>
              <span class="text-sm text-gray-400 font-medium italic flex items-center justify-between">Created At <CirclePlusOutline class="w-4 h-4" /></span>
              <span class="text-sm text-gray-300">{formatDate(new Date(flight.created_at))}</span>
            </div>
            <DropdownItem onclick={async () => {await openEditModal(flight)}} class="flex gap-2"> <EditOutline /> Edit</DropdownItem>
            <DropdownItem onclick={async () => {await archiveFlight(flight)}} class="flex gap-2"> <ArchiveOutline/> Archive</DropdownItem>
            <DropdownDivider />
            <DropdownItem onclick={async () => {await deleteFlight(flight)}} class="flex gap-2"> <FireOutline color="red" /> Delete</DropdownItem>
          </Dropdown>
          
          {/each}
        {/key}
        {/key}
        
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
  </div>

  {#if showExpandedSection}  
    <div class="w-96 flex flex-col gap-4 pl-4 py-2 overflow-y-auto overflow-x-hidden min-w-0 scrollbar scrollbar-thumb-gray-500 scrollbar-track-transparent" in:fly={{ x: 20, duration: 300 }}>
      {#if expandedFlight}
      <Card class="!py-4 !px-4">
        <span class=" text-gray-500 flex gap-2 items-center justify-between">
          <h3 class="text-white text-lg font-medium">Flight Overview</h3>
          <span class="flex items-center gap-2 justify-end">
            <p class="text-gray-500 italic text-nowrap">Id {expandedFlight.id}</p>
            <span class="w-1 h-1 rounded bg-gray-500"></span>
            <p class="italic flex items-center text-nowrap"><EditOutline/>{formatDate(new Date(expandedFlight.last_edited))}</p>
            <Tooltip>Last Edited</Tooltip>
          </span>
        </span>
        
        <span class="w-full flex gap-3 items-center mt-8 mb-4">
          <p class="text-white font-medium text-lg">{expandedFlight.route.dep_airport}</p>
          <Tooltip>Departure</Tooltip>
          <span class="flex-1 h-full flex flex-col items-center justify-center relative">
            <p class="italic text-sm absolute -translate-y-4">{formatDuration(expandedFlight.duration)}</p>
            <div class="w-full border-b-[4px] border-dotted border-gray-500"></div>
          </span>
          <p class="text-white font-medium text-lg">{expandedFlight.route.arr_airport}</p>
          <Tooltip>Arrival</Tooltip>
        </span>
        
        <!-- Airline -->
        {#if expandedFlight.company.airline}
        <span class="flex gap-4 mb-4 items-center justify-around">

          <span class="flex gap-1 mb-2 items-center">
            <img src={AirplaneSeat} alt="Airline Icon of an Airplane Seat">
            <p>{expandedFlight.company.airline.name}</p>
            <Tooltip>Airline</Tooltip>
          </span>
          
          {#if expandedFlight.company.airline.callsign}
            <span class="flex gap-1 mb-2 items-center">
              <UserHeadsetOutline size="lg" class="text-gray-300" />
              <p>{expandedFlight.company.airline.callsign}</p>
              <Tooltip>Callsign</Tooltip>
            </span>
          {/if}
        </span>
        {/if}

        <Button onclick={() => {
          if (expandedFlight) {
            openInSimbrief(expandedFlight)
          }
        }} color="alternative">Open in SimBrief</Button>
      </Card>

      <!-- Airport Cards - if complete data present -->
        {#if expandedFlight.complete_route}
          {#key expandedFlight.complete_route.dep_airport}
            <AirportCard airport={expandedFlight.complete_route.dep_airport} type="departure" />
          {/key}
          {#key expandedFlight.complete_route.arr_airport}
            <AirportCard airport={expandedFlight.complete_route.arr_airport} type="arrival" />
          {/key}
        {:else}
          <div class="my-auto text-center">
            <p class="text-lg italic text-gray-500 font-medium">Airports unavailable</p>
          </div>
        {/if}
      
      {:else}
      <h2 class="italic text-lg font-medium text-gray-600 m-auto">Click on a flight to see more</h2>
      {/if}
    </div>
  {/if}
</div>

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
          editFlight(editModalFlight, editModalContent)
        }
      }}><FloppyDiskOutline class="w-5 h-5 me-2" /> Save Changes</Button>  
    </form>
  {/if}
  
</Modal>
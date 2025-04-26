<script lang="ts">
  import { FlyListDB } from "$lib/db/database";
  import type { Tflight } from "$lib/types/flight";
  import { Button, Dropdown, DropdownDivider, DropdownItem, Input, Label, Modal, Pagination, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from "flowbite-svelte";
  import { ArchiveArrowDownOutline, ArchiveOutline, ChevronLeftOutline, ChevronRightOutline, CirclePlusOutline, DotsHorizontalOutline, EditOutline, FireOutline, FloppyDiskOutline, RefreshOutline } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import { open } from '@tauri-apps/plugin-shell';
  import { getToast } from "$lib/stores/toast.svelte";
  import { convertMinutes } from "$lib/functions/formatDuration";
  import { formatDate } from "$lib/functions/formatDate";
  import { openFlightradar } from "$lib/functions/openFlightradar";

  let flights: Tflight[] = $state([])
  let currentPageFlights: Tflight[] = $state([])
  let pages: { name: string, active: boolean }[] = $state([])
  
  const toast = getToast()

  onMount(async () => {
    await refreshFlights(false)
  })

  async function loadData() {
    flights = await FlyListDB.getFlights()
    flights = flights.filter((flight) => flight.archived === true)

    pages = []

    const pageCount = Math.ceil(flights.length / 10)

    for (let i = 0; i < pageCount; i++) {
      pages.push({ name: String(i + 1), active: false })
    }

    pages[0].active = true
  }

  async function refreshFlights(doToast=true) {
    await loadData()
    loadPage()

    if (!doToast) return

    await toast.addToast({
      title: "Archived Refreshed",
      type: "info"
    })
  }

  // Pagination
  function loadPage() {
    const selectedPage = pages.find((page) => page.active === true)

    const start = (Number(selectedPage?.name) * 10) - 10
    const end = (Number(selectedPage?.name) * 10)

    currentPageFlights = flights.slice(start, end)
  }

  const previous = () => {
    const pageIndex = pages.findIndex((page) => page.active === true)

    if (pageIndex <= 0) {
      return
    }

    pages[pageIndex].active = false
    pages[pageIndex - 1].active = true

    loadPage()
  };

  const next = () => {
    const pageIndex = pages.findIndex((page) => page.active === true)

    if (pageIndex >= pages.length - 1) {
      return
    }

    pages[pageIndex].active = false
    pages[pageIndex + 1].active = true

    loadPage()
  };

  const pageClick = (page: number) => {
    
    // Set all pages to inactive
    pages.forEach((_, i) => {
      pages[i].active = false
    })

    // Set selected page to active
    pages[page - 1].active = true

    loadPage()
  }

  async function archiveFlight(flight: Tflight) {
    try {
      await FlyListDB.toggleArchiveFlight(flight)

      await refreshFlights(false)

      await toast.addToast({
        title: `Restored Flight`,
        type: "success"
      })
    } catch (error) {
      await toast.addToast({
        title: `Failed to restore flight`,
        type: "error"
      })
    }
  }
</script>

<div class="flex justify-between items-center mb-6">
  <h2 class="text-2xl text-white font-bold">Archived Flights</h2>
  <Button aria-label="Refresh Archived Flights" onclick={() => {refreshFlights()}} size="sm" color="alternative" > <RefreshOutline /></Button>
</div>

{#if flights.length > 0}
  {#key currentPageFlights}
    <Table items={currentPageFlights} shadow divClass="relative overflow-x-auto scrollbar scrollbar-thumb-gray-500 scrollbar-track-transparent">
      <TableHead>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.id - b.id} defaultDirection="asc">ID</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.route.dep_airport.localeCompare(b.route.dep_airport)}>DEP</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.route.arr_airport.localeCompare(b.route.arr_airport)}>ARR</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.company.fl_no.localeCompare(b.company.fl_no)}>FL NO.</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.company.callsign.localeCompare(b.company.callsign)}>CALLSIGN</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.aircraft.name.localeCompare(b.aircraft.name)}>AIRCRAFT</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.duration - b.duration }>DURATION</TableHeadCell>
        <TableHeadCell></TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y ">
        <TableBodyRow slot="row" let:item>
          <TableBodyCell><span class="text-gray-400 italic">{item.id}</span></TableBodyCell>
          <TableBodyCell>{item.route.dep_airport}</TableBodyCell>
          <TableBodyCell>{item.route.arr_airport}</TableBodyCell>
          <TableBodyCell> <Button class="px-2 py-0.5 hover:cursor-pointer" onclick={async () => { await openFlightradar(item.company.airline_icao, item.company.fl_no) }} color="alternative"  >{item.company.fl_no}</Button> </TableBodyCell>
          <TableBodyCell>{item.company.callsign}</TableBodyCell>
          <TableBodyCell>{item.aircraft.name}</TableBodyCell>
          <TableBodyCell>{convertMinutes(item.duration)}</TableBodyCell>
          <TableBodyCell>
            <Button aria-label="Archive Flight" onclick={() => {archiveFlight(item)}} size="sm" color="alternative" class="py-1.5 px-2"> <ArchiveArrowDownOutline /></Button>
          </TableBodyCell>
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
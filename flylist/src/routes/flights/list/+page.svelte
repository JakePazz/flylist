<script lang="ts">
  import { FlightDB } from "$lib/db/database";
  import type { Tflight } from "$lib/types/flight";
  import { Button, Dropdown, DropdownDivider, DropdownItem, Pagination, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from "flowbite-svelte";
  import { ArchiveOutline, ChevronLeftOutline, ChevronRightOutline, DotsHorizontalOutline, DotsVerticalOutline, EditOutline, FireOutline, PenOutline, XSolid } from "flowbite-svelte-icons";
  import { onMount } from "svelte";
  import { open } from '@tauri-apps/plugin-shell';
  
  let flights: Tflight[] = $state([])
  let currentPageFlights: Tflight[] = $state([])
  let pages: { name: string, active: boolean }[] = $state([])

  onMount(async () => {
    flights = await FlightDB.readFlight()

    flights = flights.filter((flight) => flight.archived !== true)

    const pageCount = Math.ceil(flights.length / 10)
    
    for (let i = 0; i < pageCount; i++) {
      pages.push({ name: String(i + 1), active: false })
    }

    pages[0].active = true

    loadPage()
  })

  // Pagination

  function loadPage() {

    // console.log($state.snapshot(pages))

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

  // Duration formatting
  function convertMinutes(minutes: number) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours > 0 ? hours : ""}${hours > 0 ? "hr" : ""}${hours > 1 ? "s": ""} ${mins > 0 ? mins : "" }${mins > 0 ? "m" : "" }`;
  }

</script>

<h2 class="text-2xl text-white font-bold mb-6">Your Flights</h2>

{#if flights.length > 0}
  {#key currentPageFlights}
    <Table items={currentPageFlights} divClass="relative overflow-x-auto scrollbar scrollbar-thumb-gray-500 scrollbar-track-transparent">
      <TableHead>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.id - b.id} defaultDirection="asc">ID</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.route.dep_airport.localeCompare(b.route.dep_airport)}>DEP</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.route.arr_airport.localeCompare(b.route.arr_airport)}>ARR</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.company.fl_no.localeCompare(b.company.fl_no)}>FL NO.</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.company.callsign.localeCompare(b.company.callsign)}>CALLSIGN</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.ac_type.localeCompare(b.ac_type)}>AIRFRAME</TableHeadCell>
        <TableHeadCell sort={(a: Tflight, b: Tflight) => a.duration - b.duration }>DURATION</TableHeadCell>
        <TableHeadCell>ACTIONS</TableHeadCell>
      </TableHead>
      <TableBody tableBodyClass="divide-y ">
        <TableBodyRow slot="row" let:item>
          <TableBodyCell>{item.id}</TableBodyCell>
          <TableBodyCell>{item.route.dep_airport}</TableBodyCell>
          <TableBodyCell>{item.route.arr_airport}</TableBodyCell>
          <TableBodyCell> <Button class="px-2 py-0.5 hover:cursor-pointer" onclick={() => { open(`https://www.flightradar24.com/data/flights/${item.company.fl_no}`) }} color="alternative"  >{item.company.fl_no}</Button> </TableBodyCell>
          <TableBodyCell>{item.company.callsign}</TableBodyCell>
          <TableBodyCell>{item.ac_type}</TableBodyCell>
          <TableBodyCell>{convertMinutes(item.duration)}</TableBodyCell>
          <TableBodyCell>
            <DotsHorizontalOutline class="dots-menu dark:text-white" />
            <Dropdown triggeredBy=".dots-menu">
              <DropdownItem class="flex gap-2"> <EditOutline /> Edit</DropdownItem>
              <DropdownDivider />
              <DropdownItem class="flex gap-2"> <ArchiveOutline/> Archive</DropdownItem>
              <DropdownItem class="flex gap-2"> <FireOutline color="red" /> Delete</DropdownItem>
            </Dropdown>
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


<style>

  

</style>
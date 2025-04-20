<script>
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import "../app.css"
  import { Sidebar, SidebarWrapper, SidebarBrand, SidebarItem, SidebarGroup } from 'flowbite-svelte';
  import { ArchiveOutline, CogOutline, GridOutline, ListOutline, PlusOutline } from 'flowbite-svelte-icons';
  import { FlightDB } from "$lib/db/database";

  let spanClass = 'flex-1 ms-3 whitespace-nowrap';

  let site = {
    name: 'FlyList',
    href: '/',
    img: '/logo.svg'
  };

  let flightCount = $state(10);

  onMount(async () => {
    const flights = await FlightDB.readFlight()

    if (flights.length > 0) {
      flightCount = flights.length    
    }
  })


  const { children } = $props();

</script>

<main class="w-screen h-screen flex">

  <!-- Sidebar -->

  <Sidebar asideClass="w-56 !h-full">
    <SidebarWrapper divClass="overflow-y-auto py-4 px-3 bg-gray-50 rounded-sm dark:bg-gray-800 h-full flex flex-col">
      <SidebarGroup>
        <SidebarBrand {site} />

        <!-- <SidebarItem label="Dashboard"  href="/">
          <svelte:fragment slot="icon">
            <GridOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem> -->

        <SidebarItem label="Your Flights" {spanClass} href="/flights/list">
          <svelte:fragment slot="icon">
            <ListOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <svelte:fragment slot="subtext">
            <span class="inline-flex justify-center items-center p-3 ms-3 w-3 h-3 text-sm font-medium text-primary-600 bg-primary-200 rounded-full dark:bg-primary-900 dark:text-primary-200"> {flightCount} </span>
          </svelte:fragment>
        </SidebarItem>

        <SidebarItem label="Create Flight" {spanClass} href="/flights/create">
          <svelte:fragment slot="icon">
            <PlusOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
          <!-- <svelte:fragment slot="subtext">
            <span class="inline-flex justify-center items-center px-2 ms-3 text-sm font-medium text-gray-800 bg-gray-200 rounded-full dark:bg-gray-700 dark:text-gray-300"> Pro </span>
          </svelte:fragment> -->
        </SidebarItem>

      </SidebarGroup>

      <span class="flex-1"></span>

      <SidebarGroup border>

        <SidebarItem label="Archive" {spanClass} href="/flights/list">
          <svelte:fragment slot="icon">
            <ArchiveOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
        
        <SidebarItem label="Settings" href="/settings">
          <svelte:fragment slot="icon">
            <CogOutline class="w-6 h-6 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
          </svelte:fragment>
        </SidebarItem>
      </SidebarGroup>
    </SidebarWrapper>
  </Sidebar>

  <!-- Page Content -->

  <div class="px-6 py-4 flex-1 flex flex-col">
    {@render children()}
  </div>

</main>
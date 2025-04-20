<script lang="ts">
  import { getToast } from "$lib/stores/toast.svelte";
  import { onMount } from "svelte";
  import "../app.css"
  import { Sidebar, SidebarWrapper, SidebarBrand, SidebarItem, SidebarGroup, Toast, Button } from 'flowbite-svelte';
  import { ArchiveOutline, CheckOutline, CodeOutline, CogOutline, GridOutline, InfoCircleOutline, ListOutline, PlusOutline } from 'flowbite-svelte-icons';
  import { FlyListDB } from "$lib/db/database";
  import { fly } from "svelte/transition";

  let spanClass = 'flex-1 ms-3 whitespace-nowrap';
  let site = {
    name: 'FlyList',
    href: '/',
    img: '/logo.svg'
  };

  let flightCount = $state(10);

  onMount(async () => {
    const flights = await FlyListDB.readFlight()
    const activeFlights = flights.filter((flight) => flight.archived === false)

    if (activeFlights.length > 0) {
      flightCount = activeFlights.length
    }
  })

  let showToast = $state(false)
  let toastMessage = $state("")
  let toastType: "info" | "success" | "error" = $state("info")


  let toast = getToast()

  // Register a callback to listen for toast changes
  toast.registerCallback((value) => {
    if (value) {
      toastMessage = value.title;
      toastType = value.type;
      showToast = true;
      
      // Automatically hide the toast after 5 seconds
      setTimeout(() => {
        showToast = false;
      }, value.type !== "error" ? 1500 : 5000); // info & success 1.5s, error 5s
    }
  });

  const { children } = $props();

  // function toggleToast() {
  //   showToast = toast ? true : false

  //   console.log($state.snapshot(toast.value))
  // }

</script>

<main class="w-screen h-screen flex ">

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

<Toast
toastStatus={showToast}
transition={fly}
params={{ x: 200, duration: 350 }}
class="mb-4 rounded-lg fixed bottom-4 right-4 z-50"
color={toastType === "success" ? "green" : toastType === "error" ? "red" : "blue"}
position="bottom-right">

  <!-- Icon for info, success or error -->
  <svelte:fragment slot="icon">
    {#if toastType === "success"}
      <CheckOutline class="w-6 h-6" />
    {:else if toastType === "info"}
      <InfoCircleOutline class="w-6 h-6" />
    {:else}
      <CodeOutline class="w-6 h-6" />
    {/if}
  </svelte:fragment>

  {toastMessage}
</Toast>
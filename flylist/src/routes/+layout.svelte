<script lang="ts">
  import { getToast } from "$lib/stores/toast.svelte";
  import { onMount } from "svelte";
  import "../app.css"
  import { Sidebar, SidebarWrapper, SidebarBrand, SidebarItem, SidebarGroup, Toast, Button, Spinner } from 'flowbite-svelte';
  import { ArchiveOutline, CheckOutline, CodeOutline, CogOutline, GridOutline, InfoCircleOutline, ListOutline, PlusOutline } from 'flowbite-svelte-icons';
  import { FlyListDB } from "$lib/managers/database";
  import { fly } from "svelte/transition";
  import { load } from "@tauri-apps/plugin-store";
  import { type Tpreferences } from "$lib/types/preferences";
  import { goto } from "$app/navigation";
  import { MetarManager } from "$lib/managers/metar";
  import { SettingsManager } from "$lib/managers/settings";
  import { error } from "@sveltejs/kit";

  let spanClass = 'flex-1 ms-3 whitespace-nowrap';
  let site = {
    name: 'FlyList',
    href: '/',
    img: '/logo.svg'
  };

  let flightCount = $state(10)
  let disableSidebar = $state(false)
  let layoutReady = $state(false)

  onMount(async () => {
    try {

      await new Promise(resolve => setTimeout(resolve, 500)) // Wait for tauri load

      if (window.location.pathname === "/setup") {
        layoutReady = true
        disableSidebar = true
        return
      }

      // Check if setup is complete
      const settings = await load("settings.json")
      const complete = await settings.get<boolean>("setup_complete")
      
      if (!complete) {
        await goto('/setup')
      } else {
        // Load flight count and other data only if setup is complete
        const flights = await FlyListDB.getFlights()
        const activeFlights = flights.filter((flight) => flight.archived === false)
        
        if (activeFlights.length > 0) {
          flightCount = activeFlights.length
        }

      }
    } catch (error) {
      console.error("Error onMount() of layout:", error)
    }

    // Remove out of date airports in metar_cache.json
    try {
      await MetarManager.cleanupCache()
    } catch (error) {
      console.warn(`Failed to cleanup 'metar_cache.json' due to an error: ${error}`)
    }

    // Test CheckWX API key validity
    try {
      const result = await MetarManager.validateAPIKey()
      if (!result) {
        toast.addToast({
          title: "Invalid CheckWX API Key, please update it in settings",
          type: "error"
        })
      }
    } catch (error) {
      console.warn(`Failed to validate CheckWX API Key due to an error: ${error}`)
        toast.addToast({
          title: "Unable to validate CheckWX API Key due to an error; it could be invalid",
          type: "info"
        })
    }

    layoutReady = true
  })

  let showToast = $state(false)
  let toastMessage = $state("")
  let toastType: "info" | "success" | "error" = $state("info")
  let toast = getToast()

  // Register a callback to listen for toast changes
  toast.registerCallback(async (value) => {
    if (value) {
      toastMessage = value.title;
      toastType = value.type;
      showToast = true;
      
      // Log error as appropriate type
      switch (toastType) {
        case "error":
          console.error(`Error toast: ${toastMessage}`)
          break
        case "info":
          console.info(`Info toast: ${toastMessage}`)
          break
        case "success":
          console.log(`Success toast: ${toastMessage}`)
          break
      }

      // Get preferences for toast duration before autohide
      const preferences = await SettingsManager.getPreferences()
      let infoSuccessDuration = preferences.toasts.info_success_duration
      let errorDuration = preferences.toasts.error_duration

      // Automatically hide the toast after its duration
      setTimeout(() => {
        showToast = false;
      }, value.type !== "error" ? infoSuccessDuration : errorDuration);
    }
  });

  const { children } = $props();
</script>

{#if !layoutReady}
  <div class="w-screen h-screen flex items-center justify-center bg-gray-900">
    <div class="text-center">
      <Spinner size={12} />
      <p class="mt-4 text-gray-300">Loading FlyList...</p>
    </div>
  </div>
{:else}
<main class="w-screen h-screen max-h-screen flex ">

  <!-- Sidebar -->

  <Sidebar
    asideClass={`w-56 !h-full ${disableSidebar ? "pointer-events-none opacity-40 select-none" : ""}`}
  >
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

        <SidebarItem label="Archive" {spanClass} href="/flights/archive">
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
  <div class="px-6 py-4 flex-1 flex flex-col overflow-hidden max-h-[100vh]">
    {@render children()}
  </div>
</main>
{/if}

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
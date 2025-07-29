<script lang="ts">
  import { Button, ButtonGroup, Input, InputAddon, Tooltip } from "flowbite-svelte";
  import { RefreshOutline, TrashBinOutline } from "flowbite-svelte-icons";
  import AirplaneTakeoff from "$lib/assets/hugeicons/AirplaneTakeoff01.svg"
  import AirplaneLanding from "$lib/assets/hugeicons/AirplaneLanding01.svg"
  import { getToast } from "$lib/stores/toast.svelte";
  import { FlyListDB } from "$lib/managers/database";
  import type { TairportCategory } from "$lib/types/airportCategory";

  const { tagLimit = 10, onChange }: { tagLimit: number, onChange: CallableFunction } = $props()
  
  const toast = getToast()

  let airportsList: string[] = $state([])
  let currentInput: string = $state("")
  let airportCategory: TairportCategory = $state("arrival")

  let hoveredAirportTag: number = $state(-1)

  async function addAirport() {

    if (currentInput.length < 4 || currentInput.length > 4) return

    if (airportsList.includes(currentInput.toUpperCase())) {
      toast.addToast({
        title: `Airport already in list`,
        type: "info"
      })

      currentInput = ""
      return
    }

    if (airportsList.length >= tagLimit) {
      toast.addToast({
        title: `You can have a maximum of ${tagLimit} airports`,
        type: "info"
      })
      currentInput = ""
      return
    }

    const airport = await FlyListDB.getAirport(currentInput.toUpperCase())
    if (!airport) {
      toast.addToast({
        title: "Airport ICAO invalid",
        type: "error"
      })
      return
    }

    airportsList.push(currentInput.toUpperCase())
    currentInput = ""
    
    onChange({category: airportCategory, airports: airportsList})
  }

  function removeTag(index: number) {
    airportsList.splice(index, 1)
    onChange({category: airportCategory, airports: airportsList})
  }

</script>

<ButtonGroup class="w-full">
  <Button
    onclick={() => {
      airportCategory = airportCategory == "arrival" ? "departure" : "arrival"
      onChange({category: airportCategory, airports: airportsList})
    }}
    color={undefined}
    class="shrink-0 border w-48 flex gap-2 justify-start items-center border-gray-300 bg-gray-100 text-gray-900 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-600 dark:text-white "
  >
    <img title="Departure Information" class="w-6 h-6" src={airportCategory === "arrival" ? AirplaneLanding : AirplaneTakeoff} alt="Airport Icon">
    {airportCategory == "arrival" ? "Arrival" : "Departure"} Airports
  </Button>

  <Tooltip class="flex gap-1">
    <RefreshOutline class="{airportCategory == "arrival" ? "rotate-0" : "rotate-180"} transition-all duration-300"  />
    Click to filter {airportCategory == "arrival" ? "departure" : "arrival"} airports
  </Tooltip>

  {#if airportsList.length > 0}
      <InputAddon class="!bg-gray-700 border-r-0 flex gap-2 ">
        {#each airportsList as tag, index}
          <Button
            color="alternative"
            class="!px-3 !py-1 rounded-md w-14 hover:!bg-red-500 hover:!border-0 flex items-center gap-2"
            on:mouseenter={() => (hoveredAirportTag = index)}
            on:mouseleave={() => (hoveredAirportTag = -1)}
            on:click={() => removeTag(index)}
            >
            {#if hoveredAirportTag === index}
              <TrashBinOutline class="w-4 h-4" />
            {:else}
              {tag}
            {/if}
          </Button>
        {/each}
      </InputAddon>
  {/if}

  <Input
  placeholder="Press enter to add an ICAO code"
  bind:value={currentInput}
  on:input={() => {
    currentInput = currentInput.toUpperCase()
    if (currentInput.length > 4) {
      currentInput = currentInput.slice(0, 4);
    }
  }}
  onkeydown={(event) => {
    if (event.code == "Enter") {
      addAirport()
    }

    if (event.code === "Backspace" || event.code === "Delete") {
      airportsList.pop()
      onChange({category: airportCategory, airports: airportsList})
    }
  }}
  class="border-l-0 min-w-fit"
  />
</ButtonGroup>

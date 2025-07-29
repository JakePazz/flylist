<script lang="ts">
  import { Button, ButtonGroup, Dropdown, DropdownItem, Input, InputAddon, MultiSelect, Tooltip } from "flowbite-svelte";
  import { ChevronDownOutline, CloseOutline, RefreshOutline, TrashBinOutline, TrashBinSolid, UserCircleSolid, UserHeadsetOutline } from "flowbite-svelte-icons";
  import AirplaneTakeoff from "$lib/assets/hugeicons/AirplaneTakeoff01.svg"
  import AirplaneLanding from "$lib/assets/hugeicons/AirplaneLanding01.svg"
  import { getToast } from "$lib/stores/toast.svelte";
  import { FlyListDB } from "$lib/managers/database";
  import type { TairportCategory } from "$lib/types/airportCategory";

  const { tagLimit = 10, onChange }: { tagLimit: number, onChange: CallableFunction } = $props()
  
  const toast = getToast()

  let airlinesList: string[] = $state([])
  let currentInput: string = $state("")

  let hoveredAirlineTag: number = $state(-1);

  async function addAirline() {

    if (currentInput.length < 3 || currentInput.length > 3) return

    if (airlinesList.includes(currentInput.toUpperCase())) {
      toast.addToast({
        title: `Airline already in list`,
        type: "info"
      })

      currentInput = ""
      return
    }

    if (airlinesList.length >= tagLimit) {
      toast.addToast({
        title: `You can have a maximum of ${tagLimit} airlines`,
        type: "info"
      })
      currentInput = ""
      return
    }

    const airline = await FlyListDB.getAirline(currentInput.toUpperCase())
    if (!airline) {
      toast.addToast({
        title: "Airline ICAO invalid",
        type: "error"
      })
      return
    }

    airlinesList.push(currentInput.toUpperCase())
    currentInput = ""
    
    onChange({airlines: airlinesList})
  }

  function removeTag(index: number) {
    airlinesList.splice(index, 1)
    onChange({airlines: airlinesList})
  }

</script>

<ButtonGroup class="w-full">

  <InputAddon>
    <UserHeadsetOutline color="white" />
  </InputAddon>

  {#if airlinesList.length > 0}
    <InputAddon class="!bg-gray-700 border-r-0 flex gap-2 ">
      {#each airlinesList as tag, index}
      <Button
      color="alternative"
      class="!px-3 !py-1 rounded-md w-14 hover:!bg-red-500 hover:!border-0 flex items-center gap-2"
      on:mouseenter={() => (hoveredAirlineTag = index)}
      on:mouseleave={() => (hoveredAirlineTag = -1)}
      on:click={() => removeTag(index)}
      >
      {#if hoveredAirlineTag === index}
        <TrashBinOutline  class="w-4 h-4" />
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
      if (currentInput.length > 3) {
        currentInput = currentInput.slice(0, 3);
      }
    }}
    onkeydown={(event) => {
      if (event.code == "Enter") {
        addAirline()
        return
      }

      if ((event.code === "Backspace" || event.code === "Delete") && currentInput.length < 1) {
        airlinesList.pop()
        onChange({airlines: airlinesList})
        return
      }
    }}
    class="border-l-0"
  />
</ButtonGroup>

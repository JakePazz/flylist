<script lang="ts">
  import type { Tflight } from '$lib/types/flight';
  import { Label, Input, Button, Helper, Dropdown, Radio, Card } from 'flowbite-svelte';
  import { ChevronDownOutline, CreditCardPlusAltOutline } from 'flowbite-svelte-icons';
  import { FlyListDB } from '$lib/managers/database';
  import { onMount } from 'svelte';
  import type { Taircraft } from '$lib/types/aircraft';
  import { getToast } from '$lib/stores/toast.svelte';
  import { goto } from '$app/navigation';

  let aircrafts: Taircraft[] = $state([])
  let flightInputs: Tflight | undefined = $state({
    aircraft: { // Replaced in effect with index 0 in `aircrafts`
      icao_code: "",
      manufacturer: "",
      model: "",
      name: "",
      created_at: new Date(),
      id: 0,
    },
    company: {
      callsign: "",
      fl_no: "",
      airline_icao: "",
    },
    duration: 0,
    route: {
      arr_airport: "",
      dep_airport: "",
    },
    archived: false,
    created_at: new Date(),
    id: 0,
    last_edited: new Date(),
  })

  const toast = getToast()

  onMount(async () => {
    // Get aircraft and default dropdown to first one in array
    aircrafts = await FlyListDB.getAircraft()
    flightInputs.aircraft = aircrafts[0]
  })

  let hoursInput: number = $state(0)
  let minutesInput: number = $state(0)

  $effect(() => {
    if (flightInputs) {
      flightInputs.duration = (hoursInput * 60) + minutesInput
    }
  })

  // Active validation for when user inputs values
  $effect(() => {
    if (minutesInput > 60) {
      minutesInput = 60
    }

    if (minutesInput < 0) {
      minutesInput = 0
    }

    if (hoursInput > 32) {
      hoursInput = 32
    }

    if (hoursInput < 0) {
      hoursInput = 0
    }

    // Limit length of arr and dep to 4 chars
    if (flightInputs.route.dep_airport.length > 4) {
      flightInputs.route.dep_airport = flightInputs.route.dep_airport.substring(0, 4)
    }

    if (flightInputs.route.arr_airport.length > 4) {
      flightInputs.route.arr_airport = flightInputs.route.arr_airport.substring(0, 4)
    }

    if (flightInputs.company.airline_icao.length > 3) {
      flightInputs.company.airline_icao = flightInputs.company.airline_icao.substring(0, 3)
    }

  })

  async function createFlight() {
    try {
      if (!flightInputs) return

      // Departure Airport valid check
      const depAirport = await FlyListDB.getAirport(flightInputs.route.dep_airport)
      if (!depAirport) {
        toast.addToast({
          title: "Departure airport invalid",
          type: "error"
        })
        return
      }

      // Arrival Airport valid check
      const arrAirport = await FlyListDB.getAirport(flightInputs.route.arr_airport)
      if (!arrAirport) {
        toast.addToast({
          title: "Arrival airport invalid",
          type: "error"
        })
        return
      }

      // Airline ICAO valid check
      const airline = await FlyListDB.getAirline(flightInputs.company.airline_icao)
      if (!airline) {
        toast.addToast({
          title: "Airline ICAO invalid",
          type: "error"
        })
        return
      }

      // Duration is a positive value
      if (flightInputs.duration <= 0) {
        toast.addToast({
          title: "Duration invalid",
          type: "error"
        })
        return
      }

      // Flight number provided check
      if (!flightInputs.company.fl_no) {
        toast.addToast({
          title: "Flight number required",
          type: "error"
        })
        return
      }

      // Defaults callsign to the flight no. if no value entered
      if (!flightInputs.company.callsign) {
        flightInputs.company.callsign = flightInputs.company.fl_no
      }
      
      await FlyListDB.createFlight(flightInputs)

      toast.addToast({
        title: "Created new flight",
        type: "success"
      })

      goto("/flights/list")

    } catch (error) {
      console.error(error)
    }
  }

  let aircraftGroup = $state(1); // Used by aircraft dropdown

  // Update aircraft based upon dropdown changes `aircraftGroup`
  $effect(() => { 
    const ac = aircrafts.find((ac) => ac.id === aircraftGroup)
    if (!ac) return

    flightInputs.aircraft = ac
  })

</script>

<span class="flex-1 flex flex-col items-center justify-center">

  <Card class="max-w-[450px]">
    <form class="flex flex-col gap-6">

      <span class="flex flex-col gap-2">
        <h2 class="text-2xl text-white font-bold">Create a Flight</h2>
        <p class="text-gray-500 ">Create a new flight to add to your simming wishlist.</p>
      </span>
      
      <div class="flex gap-6">
        <span class="flex-1">
          <Label>Departure Airport</Label>
          <Input id="dep-airport" placeholder="EGLL" bind:value={flightInputs.route.dep_airport}/>
        </span>
        
        <span class="flex-1">
          <Label>Arrival Airport</Label>
          <Input id="arr-airport" placeholder="EGPH" bind:value={flightInputs.route.arr_airport}/>
        </span>
      </div>

      <div class="flex-col gap-1">
        
        <span class="flex gap-6">
          <span class="flex-2">
            <Label>Airline</Label>
            <Input class="flex-1" id="flight-no-airline" placeholder="BAW" bind:value={flightInputs.company.airline_icao}/>
          </span>

          <span class="flex-3">
            <Label>Flight Number</Label>
            <Input class="flex-2" id="flight-no" placeholder={`123`} bind:value={flightInputs.company.fl_no}/>
          </span>
          
          <span class="flex-3">
            <Label>Callsign</Label>
            <Input id="callsign" placeholder="BAW456" bind:value={flightInputs.company.callsign}/>
          </span>
        </span>
        <Helper class="text-sm mt-1">Find an airline's ICAO code <a href="https://www.avcodes.co.uk/airlcodesearch.asp" target="_blank" class="font-medium text-primary-600 hover:underline dark:text-primary-500">here</a></Helper>
      </div>

      <div class="flex gap-6 ">
        <span class="flex-4">
          <Label>Aircraft Type</Label>
          {#key aircraftGroup}
            <Button color="alternative" class="w-max">
              {aircrafts.find((ac) => ac.id === aircraftGroup)?.name || "Select an aircraft"} <ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown class="w-44 p-3 space-y-3 text-sm">
              {#each aircrafts as aircraft}
              <li class="rounded-sm p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                <Radio name="Aircraft Type" bind:group={aircraftGroup} value={aircraft.id}>{aircraft.name}</Radio>
              </li>
              {/each}
            </Dropdown>
          {/key}
          
          <Helper class="text-sm mt-1">Update your available aircraft in <a href="/settings" class="font-medium text-primary-600 hover:underline dark:text-primary-500">settings</a></Helper>
        </span>

        
        <span class="flex-1">
          <Label>Hours</Label>
          <Input type="number" id="" placeholder="2" bind:value={hoursInput}/>
        </span>
        
        <span class="flex-1">
          <Label>Minutes</Label>
          <Input type="number" id="arr-airport" placeholder="15" bind:value={minutesInput}/>
        </span>
      </div>

      <Button onclick={createFlight}> <CreditCardPlusAltOutline class="w-5 h-5 me-2" /> Create Flight</Button>

    </form>
  </Card>
</span>
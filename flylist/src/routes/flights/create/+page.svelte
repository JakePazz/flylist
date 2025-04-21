<script lang="ts">
  import type { Tflight } from '$lib/types/flight';
  import { Label, Input, Button, Toast, Helper } from 'flowbite-svelte';
  import { CheckOutline, CreditCardPlusAltOutline } from 'flowbite-svelte-icons';
  import { FlyListDB } from '$lib/db/database';
  import { fly } from 'svelte/transition';

  const flightInputs: Tflight = $state({
    ac_type: "",
    company: {
      callsign: "",
      fl_no: "",
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

  let hoursInput: number = $state(0)
  let minutesInput: number = $state(0)
  let showSuccessToast: boolean = $state(false)

  $effect(() => {
    flightInputs.duration = (hoursInput * 60) + minutesInput
  })

  async function createFlight() {
    try {
      await FlyListDB.createFlight(flightInputs)

      showSuccessToast = true

      // Close toast after 3 seconds
      setTimeout(() => {
        showSuccessToast = false
      }, 3000)

    } catch (error) {
      console.error(error)
    }
  }

</script>

<span class="flex-1 flex flex-col items-center justify-center">


  <form class="flex flex-col gap-6 max-w-[500px]">

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

    <div class="flex gap-6">
      <span class="flex-1">
        <Label>Flight Number</Label>
        <Input id="flight-no" placeholder="BA123" bind:value={flightInputs.company.fl_no}/>
      </span>
      
      <span class="flex-1">
        <Label>Callsign</Label>
        <Input id="callsign" placeholder="BAW456" bind:value={flightInputs.company.callsign}/>
      </span>
    </div>

    <div class="flex gap-6 ">
      <span class="flex-4">
        <Label>Aircraft Type</Label>
        <Input id="ac-type" placeholder="A320" bind:value={flightInputs.ac_type}/>
        <Helper class="text-sm mt-1">Update your available aircrafts in <a href="/settings" class="font-medium text-primary-600 hover:underline dark:text-primary-500">settings</a></Helper>
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
</span>

{#if showSuccessToast}
  <Toast transition={fly} params={{ x: 200 }} color="green" class="mb-4 rounded-lg" position="bottom-right" dismissable={false}>
    <CheckOutline slot="icon" class="w-6 h-6" /> Created New Flight
  </Toast>
{/if}
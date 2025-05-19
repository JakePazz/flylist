<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";


  // Redirect to flights/list
  onMount(() => {
    goto("/flights/list")
  })

</script>
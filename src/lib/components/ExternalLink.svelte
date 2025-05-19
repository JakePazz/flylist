<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  const { link, class: className, style = "primary", children }: { link: string, class?: ClassValue, style?: "primary" | "alternative", children: Snippet } = $props()
</script>

<a class="font-medium hover:underline transition-all {style === "primary" ? "text-primary-500 hover:text-primary-600" : "text-gray-100 hover:text-gray-400"} {className}" target="_blank" href={link}>{@render children()}</a>
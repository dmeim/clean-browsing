<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";
  let { class: className, ...restProps }: { class?: string; [key: string]: unknown } = $props();
</script>

<DialogPrimitive.Title
  class={cn("text-lg leading-none font-semibold tracking-tight", className)}
  {...restProps}
/>

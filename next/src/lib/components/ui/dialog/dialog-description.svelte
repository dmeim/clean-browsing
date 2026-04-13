<script lang="ts">
  import { Dialog as DialogPrimitive } from "bits-ui";
  import { cn } from "$lib/utils.js";
  let { class: className, ...restProps }: { class?: string; [key: string]: unknown } = $props();
</script>

<DialogPrimitive.Description
  class={cn("text-sm text-muted-foreground", className)}
  {...restProps}
/>

<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";
  let {
    class: className,
    children,
    ...restProps
  }: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<div
  class={cn("bg-card text-card-foreground rounded-lg border shadow-sm", className)}
  {...restProps}
>
  {@render children?.()}
</div>

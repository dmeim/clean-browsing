<script lang="ts">
  import type { Snippet } from "svelte";
  import { cn } from "$lib/utils.js";
  let {
    class: className,
    children,
    ...restProps
  }: { class?: string; children?: Snippet; [key: string]: unknown } = $props();
</script>

<h3
  class={cn("text-2xl font-semibold leading-none tracking-tight", className)}
  {...restProps}
>
  {@render children?.()}
</h3>

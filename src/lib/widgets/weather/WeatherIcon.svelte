<script lang="ts">
  import { ICON_NODES, type IconName } from "./icons.js";

  type Props = {
    name: IconName;
    size?: number;
    strokeWidth?: number;
    class?: string;
  };

  let { name, size = 24, strokeWidth = 2, class: className = "" }: Props = $props();

  const nodes = $derived(ICON_NODES[name]);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  aria-hidden="true"
>
  {#each nodes as [tag, attrs] (tag + JSON.stringify(attrs))}
    <svelte:element this={tag} {...attrs} />
  {/each}
</svg>

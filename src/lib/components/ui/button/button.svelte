<script lang="ts">
  import { Button as ButtonPrimitive } from "bits-ui";
  import { buttonVariants, type Props } from "./index.js";
  import { cn } from "$lib/utils.js";

  let {
    class: className,
    variant = "default",
    size = "default",
    ref = $bindable(null),
    ...restProps
  }: Props & { ref?: HTMLElement | null } = $props();
</script>

<ButtonPrimitive.Root
  bind:ref
  class={cn(buttonVariants({ variant, size }), className)}
  {...restProps}
/>

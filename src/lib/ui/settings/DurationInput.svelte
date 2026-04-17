<script lang="ts">
  import { parseDuration, formatDuration } from "$lib/utils/duration.js";

  type Props = {
    valueMs: number;
    minMs?: number;
    maxMs?: number;
    onChange: (ms: number) => void;
    placeholder?: string;
    id?: string;
  };

  let {
    valueMs,
    minMs = 0,
    maxMs = Number.MAX_SAFE_INTEGER,
    onChange,
    placeholder = "e.g. 5s",
    id,
  }: Props = $props();

  let focused = $state(false);
  // Initial value snapshot — $effect below keeps it in sync with
  // external changes. svelte-check flags the initial read as
  // "locally captured" but that's intentional here.
  // svelte-ignore state_referenced_locally
  let buffer = $state(formatDuration(valueMs));
  let invalid = $state(false);

  // Sync the buffer from the prop whenever the value changes externally
  // (e.g., schema migration, parent reset). While focused we leave the
  // buffer alone so we don't stomp on the user's in-progress typing.
  $effect(() => {
    const v = valueMs;
    if (focused) return;
    buffer = formatDuration(v);
    invalid = false;
  });

  function commit() {
    const parsed = parseDuration(buffer);
    if (parsed === null) {
      invalid = true;
      return;
    }
    const clamped = Math.max(minMs, Math.min(maxMs, parsed));
    invalid = false;
    buffer = formatDuration(clamped);
    if (clamped !== valueMs) onChange(clamped);
  }

  function handleBlur() {
    focused = false;
    commit();
  }

  function handleKey(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      (e.currentTarget as HTMLInputElement).blur();
    }
  }
</script>

<input
  {id}
  type="text"
  class="duration-input"
  class:invalid
  value={buffer}
  {placeholder}
  spellcheck="false"
  autocapitalize="off"
  autocomplete="off"
  onfocus={() => (focused = true)}
  onblur={handleBlur}
  oninput={(e) => {
    buffer = (e.currentTarget as HTMLInputElement).value;
    invalid = false;
  }}
  onkeydown={handleKey}
/>

<style>
  .duration-input {
    width: 100%;
    padding: 0.4rem 0.6rem;
    border-radius: 0.375rem;
    background: rgb(2 6 23 / 0.6);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.82rem;
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-variant-numeric: tabular-nums;
  }

  .duration-input:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .duration-input.invalid {
    border-color: rgb(248 113 113);
  }

  .duration-input.invalid:focus {
    box-shadow: 0 0 0 2px rgb(248 113 113 / 0.25);
  }
</style>

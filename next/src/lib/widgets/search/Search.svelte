<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import {
    type SearchSettings,
    ENGINE_NAMES,
    getEngineLogo,
  } from "./definition.js";

  let { settings }: WidgetProps<SearchSettings> = $props();

  let query = $state("");

  const logoSrc = $derived(getEngineLogo(settings));
  const placeholder = $derived(`Search ${ENGINE_NAMES[settings.engine] ?? "Google"}`);

  function performSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;

    const template = settings.customUrl || "https://www.google.com/search?q=%s";
    const encoded = encodeURIComponent(trimmed);
    const url = template.replace(/%[sq]/g, encoded);

    switch (settings.target) {
      case "currentTab":
        window.location.href = url;
        break;
      case "newWindow": {
        // browser.windows.create needs extension privileges; fall back on failure
        const b = (globalThis as any).browser;
        if (b?.windows?.create) {
          b.windows
            .create({ url, width: 1024, height: 768 })
            .catch(() => window.open(url, "_blank"));
        } else {
          window.open(url, "_blank");
        }
        break;
      }
      case "incognito": {
        const b = (globalThis as any).browser;
        if (b?.windows?.create) {
          b.windows
            .create({ url, incognito: true, width: 1024, height: 768 })
            .catch(() => window.open(url, "_blank"));
        } else {
          window.open(url, "_blank");
        }
        break;
      }
      case "newTab":
      default:
        window.open(url, "_blank");
        break;
    }

    if (settings.clearAfterSearch) {
      query = "";
    }
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    performSearch(query);
  }
</script>

<form class="search" onsubmit={handleSubmit}>
  {#if logoSrc}
    <img class="logo" src={logoSrc} alt={ENGINE_NAMES[settings.engine]} />
  {:else}
    <div class="logo-placeholder" aria-hidden="true">?</div>
  {/if}

  <div class="input-wrap">
    <input
      type="text"
      class="input"
      {placeholder}
      bind:value={query}
      autocomplete="off"
      spellcheck="false"
    />
    <button type="submit" class="submit" aria-label="Search">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    </button>
  </div>
</form>

<style>
  .search {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    height: 100%;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85 / 0.5);
    border-radius: 0.75rem;
    backdrop-filter: blur(12px);
  }

  .logo {
    height: 60%;
    max-height: 2.25rem;
    width: auto;
    object-fit: contain;
    flex-shrink: 0;
  }

  .logo-placeholder {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(71 85 105);
    color: rgb(226 232 240);
    border-radius: 9999px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .input-wrap {
    flex: 1;
    display: flex;
    align-items: center;
    background: rgb(2 6 23 / 0.5);
    border: 1px solid rgb(71 85 105);
    border-radius: 9999px;
    padding: 0 0.35rem 0 1rem;
    min-width: 0;
    height: 70%;
    max-height: 2.5rem;
    transition: border-color 120ms ease, box-shadow 120ms ease;
  }

  .input-wrap:focus-within {
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: rgb(241 245 249);
    font-size: 0.95rem;
    min-width: 0;
  }

  .input::placeholder {
    color: rgb(100 116 139);
  }

  .submit {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    background: rgb(59 130 246);
    color: white;
    border: none;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 120ms ease;
  }

  .submit:hover {
    background: rgb(37 99 235);
  }
</style>

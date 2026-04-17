<script lang="ts">
  import type { WidgetSettingsTabProps } from "$lib/widgets/types.js";
  import {
    type SearchSettings,
    type SearchEngine,
    type SearchTarget,
    ENGINE_URLS,
    getEngineUrl,
  } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsTabProps<SearchSettings> = $props();

  function set<K extends keyof SearchSettings>(key: K, value: SearchSettings[K]) {
    updateSettings({ ...settings, [key]: value });
  }

  function handleEngineChange(event: Event) {
    const next = (event.currentTarget as HTMLSelectElement).value as SearchEngine;

    if (next === "custom") {
      const predefined = Object.values(ENGINE_URLS) as string[];
      const nextUrl = predefined.includes(settings.customUrl) ? "" : settings.customUrl;
      updateSettings({ ...settings, engine: next, customUrl: nextUrl });
    } else {
      // Switch engines: auto-populate URL, clear custom image (it belongs to "custom" only).
      updateSettings({
        ...settings,
        engine: next,
        customUrl: getEngineUrl(next),
        customImageUrl: "",
      });
    }
  }

  function handleTargetChange(event: Event) {
    set("target", (event.currentTarget as HTMLSelectElement).value as SearchTarget);
  }

  function handleUrlInput(event: Event) {
    set("customUrl", (event.currentTarget as HTMLInputElement).value);
  }

  function handleImageUrlInput(event: Event) {
    set("customImageUrl", (event.currentTarget as HTMLInputElement).value);
  }

  function handleClearChange(event: Event) {
    set("clearAfterSearch", (event.currentTarget as HTMLInputElement).checked);
  }
</script>

<div class="form">
  <div class="section">
    <label for="search-engine" class="label">Search engine</label>
    <select id="search-engine" class="select" value={settings.engine} onchange={handleEngineChange}>
      <option value="google">Google</option>
      <option value="bing">Bing</option>
      <option value="duckduckgo">DuckDuckGo</option>
      <option value="yahoo">Yahoo</option>
      <option value="custom">Custom</option>
    </select>
  </div>

  <div class="section">
    <label for="search-url" class="label">
      Search URL
      <span class="hint">use <code>%s</code> or <code>%q</code> for the query</span>
    </label>
    <input
      id="search-url"
      type="text"
      class="text-input"
      placeholder="https://example.com/search?q=%s"
      value={settings.customUrl}
      oninput={handleUrlInput}
    />
  </div>

  {#if settings.engine === "custom"}
    <div class="section">
      <label for="search-image" class="label">
        Custom image URL
        <span class="hint">optional — logo shown next to the search bar</span>
      </label>
      <input
        id="search-image"
        type="text"
        class="text-input"
        placeholder="https://example.com/logo.png"
        value={settings.customImageUrl}
        oninput={handleImageUrlInput}
      />
    </div>
  {/if}

  <div class="section">
    <label for="search-target" class="label">Open search in</label>
    <select id="search-target" class="select" value={settings.target} onchange={handleTargetChange}>
      <option value="newTab">New tab</option>
      <option value="currentTab">Current tab</option>
      <option value="newWindow">New window</option>
      <option value="incognito">New private window</option>
    </select>
  </div>

  <label class="row">
    <span class="label inline">Clear input after search</span>
    <input type="checkbox" checked={settings.clearAfterSearch} onchange={handleClearChange} />
  </label>
</div>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .label {
    font-size: 0.8rem;
    color: rgb(148 163 184);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
  }

  .label.inline {
    text-transform: none;
    letter-spacing: normal;
    font-weight: normal;
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  .hint {
    font-size: 0.7rem;
    text-transform: none;
    letter-spacing: normal;
    color: rgb(100 116 139);
    font-weight: 400;
  }

  .hint code {
    background: rgb(2 6 23 / 0.6);
    padding: 0.05rem 0.3rem;
    border-radius: 0.25rem;
    color: rgb(203 213 225);
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .text-input,
  .select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(71 85 105);
    color: rgb(241 245 249);
    font-size: 0.9rem;
  }

  .text-input {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
  }

  .text-input:focus,
  .select:focus {
    outline: none;
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: rgb(15 23 42 / 0.5);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    cursor: pointer;
  }

  input[type="checkbox"] {
    width: 1rem;
    height: 1rem;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }
</style>

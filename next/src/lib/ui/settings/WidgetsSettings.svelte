<script lang="ts">
  const items = [
    "Corner roundness",
    "Shadows",
    "Glow",
    "Text color",
    "Background color",
    "Border color",
  ];
</script>

<section class="panel">
  <header>
    <h3>Widgets</h3>
    <p>Global widget appearance defaults.</p>
  </header>

  <div class="placeholder">
    <div class="title">Coming soon</div>
    <p>
      Global defaults for widget styling will live here. You'll be able to tweak these for every
      widget at once, with per-widget overrides on individual widgets.
    </p>
    <ul>
      {#each items as item}
        <li>{item}</li>
      {/each}
    </ul>
  </div>
</section>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: rgb(241 245 249);
  }
  header p {
    margin: 0.125rem 0 0;
    font-size: 0.8125rem;
    color: rgb(148 163 184);
  }
  .placeholder {
    padding: 1.25rem;
    border: 1px dashed rgb(71 85 105);
    background: rgb(15 23 42 / 0.4);
    border-radius: 0.5rem;
    color: rgb(148 163 184);
  }
  .title {
    font-size: 0.875rem;
    font-weight: 600;
    color: rgb(226 232 240);
    margin-bottom: 0.5rem;
  }
  .placeholder p {
    margin: 0 0 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.5;
  }
  ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.8125rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
</style>

<script lang="ts">
  type Props = {
    paddingV: number;
    paddingH: number;
    onChange: (next: { paddingV: number; paddingH: number }) => void;
    min?: number;
    max?: number;
  };

  let { paddingV, paddingH, onChange, min = 0, max = 80 }: Props = $props();
</script>

<div class="section">
  <div class="label-row">
    <span class="label">Vertical padding</span>
    <span class="value">{paddingV}px</span>
  </div>
  <input
    type="range"
    {min}
    {max}
    step="1"
    value={paddingV}
    oninput={(e) =>
      onChange({
        paddingV: Number((e.currentTarget as HTMLInputElement).value),
        paddingH,
      })}
  />
</div>

<div class="section">
  <div class="label-row">
    <span class="label">Horizontal padding</span>
    <span class="value">{paddingH}px</span>
  </div>
  <input
    type="range"
    {min}
    {max}
    step="1"
    value={paddingH}
    oninput={(e) =>
      onChange({
        paddingV,
        paddingH: Number((e.currentTarget as HTMLInputElement).value),
      })}
  />
</div>

<style>
  .section {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .label-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .label {
    font-size: 0.875rem;
    color: rgb(226 232 240);
  }

  .value {
    font-size: 0.75rem;
    color: rgb(203 213 225);
    font-variant-numeric: tabular-nums;
  }

  input[type="range"] {
    width: 100%;
    accent-color: rgb(59 130 246);
    cursor: pointer;
  }
</style>

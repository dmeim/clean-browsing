<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import {
    type CalculatorSettings,
    type CalcHistoryEntry,
    MAX_HISTORY,
  } from "./definition.js";
  import { widgetScaler } from "$lib/grid/widgetScaler.js";

  let { settings, updateSettings }: WidgetProps<CalculatorSettings> = $props();

  type Operator = "+" | "-" | "*" | "/";

  let currentInput = $state("0");
  let previousValue = $state<string | null>(null);
  let operator = $state<Operator | null>(null);
  let waitingForInput = $state(false);
  let historyOpen = $state(false);

  // Normalize settings with fallbacks for any older instances missing the new fields.
  const historyEnabled = $derived(settings.historyEnabled ?? true);
  const history = $derived<CalcHistoryEntry[]>(settings.history ?? []);

  function setDisplay(next: string) {
    currentInput = next;
  }

  function appendHistory(expression: string, result: string) {
    currentInput = result;
    if (!historyEnabled) return;
    const entry: CalcHistoryEntry = {
      expression,
      result,
      timestamp: Date.now(),
    };
    const next = [entry, ...history].slice(0, MAX_HISTORY);
    updateSettings({ ...settings, history: next });
  }

  function clearHistory() {
    updateSettings({ ...settings, history: [] });
  }

  function calculate(prev: string, curr: string, op: Operator): number {
    const a = parseFloat(prev);
    const b = parseFloat(curr);
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : 0;
    }
  }

  function formatResult(n: number): string {
    if (!Number.isFinite(n)) return "Error";
    // Trim excessive trailing zeros without losing precision.
    const rounded = Math.round(n * 1e10) / 1e10;
    return String(rounded);
  }

  function operatorSymbol(op: Operator): string {
    return op === "*" ? "×" : op === "/" ? "÷" : op;
  }

  function pressNumber(key: string) {
    if (waitingForInput || currentInput === "0") {
      setDisplay(key === "." && currentInput === "0" ? "0." : key);
      waitingForInput = false;
      return;
    }
    if (key === "." && currentInput.includes(".")) return;
    setDisplay(currentInput + key);
  }

  function pressOperator(op: Operator) {
    if (previousValue !== null && !waitingForInput) {
      const result = formatResult(calculate(previousValue, currentInput, operator!));
      setDisplay(result);
      currentInput = result;
    }
    previousValue = currentInput;
    operator = op;
    waitingForInput = true;
  }

  function pressEquals() {
    if (previousValue === null || operator === null) return;
    const expression = `${previousValue} ${operatorSymbol(operator)} ${currentInput}`;
    const result = formatResult(calculate(previousValue, currentInput, operator));
    appendHistory(expression, result);
    previousValue = null;
    operator = null;
    waitingForInput = true;
  }

  function pressClear() {
    previousValue = null;
    operator = null;
    waitingForInput = false;
    setDisplay("0");
  }

  function pressBackspace() {
    if (currentInput.length > 1) {
      setDisplay(currentInput.slice(0, -1));
    } else {
      setDisplay("0");
    }
  }

  function loadFromHistory(entry: CalcHistoryEntry) {
    previousValue = null;
    operator = null;
    waitingForInput = true;
    setDisplay(entry.result);
    historyOpen = false;
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!settings.keyboardSupport) return;
    const k = event.key;
    if ("0123456789.".includes(k)) {
      event.preventDefault();
      pressNumber(k);
      return;
    }
    if ("+-*/".includes(k)) {
      event.preventDefault();
      pressOperator(k as Operator);
      return;
    }
    if (k === "Enter" || k === "=") {
      event.preventDefault();
      pressEquals();
      return;
    }
    if (k === "Escape") {
      event.preventDefault();
      pressClear();
      return;
    }
    if (k === "Backspace") {
      event.preventDefault();
      pressBackspace();
      return;
    }
  }

  const canShowHistoryToggle = $derived(historyEnabled);
  const padV = $derived(settings.paddingV ?? 8);
  const padH = $derived(settings.paddingH ?? 8);
</script>

<div class="widget-card calc">
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="widget-inner calc-inner"
  class:round={settings.roundButtons}
  tabindex={settings.keyboardSupport ? 0 : -1}
  role="application"
  onkeydown={handleKeyDown}
  use:widgetScaler
  style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
>
  <div class="display">
    <div class="display-text">{currentInput}</div>
    {#if canShowHistoryToggle}
      <button
        type="button"
        class="history-toggle"
        class:active={historyOpen}
        aria-label="Toggle history"
        aria-pressed={historyOpen}
        onclick={() => (historyOpen = !historyOpen)}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 3v6h6" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>
    {/if}
  </div>

  {#if historyOpen && historyEnabled}
    <div class="history">
      <div class="history-header">
        <span class="history-title">History</span>
        <button
          type="button"
          class="history-clear"
          disabled={history.length === 0}
          onclick={clearHistory}
        >
          Clear
        </button>
      </div>
      <div class="history-list">
        {#if history.length === 0}
          <div class="history-empty">No calculations yet</div>
        {:else}
          {#each history as entry (entry.timestamp)}
            <button
              type="button"
              class="history-entry"
              onclick={() => loadFromHistory(entry)}
              title="Load result"
            >
              <span class="history-expression">{entry.expression}</span>
              <span class="history-result">= {entry.result}</span>
            </button>
          {/each}
        {/if}
      </div>
    </div>
  {:else}
    <div class="buttons">
      <button class="btn clear" class:colored={settings.colorClear} onclick={pressClear}>C</button>
      <button class="btn clear" class:colored={settings.colorClear} onclick={pressBackspace}>⌫</button>
      <button class="btn op" class:colored={settings.colorOperators} onclick={() => pressOperator("/")}>÷</button>
      <button class="btn op" class:colored={settings.colorOperators} onclick={() => pressOperator("*")}>×</button>

      <button class="btn num" onclick={() => pressNumber("7")}>7</button>
      <button class="btn num" onclick={() => pressNumber("8")}>8</button>
      <button class="btn num" onclick={() => pressNumber("9")}>9</button>
      <button class="btn op" class:colored={settings.colorOperators} onclick={() => pressOperator("-")}>−</button>

      <button class="btn num" onclick={() => pressNumber("4")}>4</button>
      <button class="btn num" onclick={() => pressNumber("5")}>5</button>
      <button class="btn num" onclick={() => pressNumber("6")}>6</button>
      <button class="btn op" class:colored={settings.colorOperators} onclick={() => pressOperator("+")}>+</button>

      <button class="btn num" onclick={() => pressNumber("1")}>1</button>
      <button class="btn num" onclick={() => pressNumber("2")}>2</button>
      <button class="btn num" onclick={() => pressNumber("3")}>3</button>
      <button class="btn eq" class:colored={settings.colorEquals} onclick={pressEquals}>=</button>

      <button class="btn num zero" onclick={() => pressNumber("0")}>0</button>
      <button class="btn num" onclick={() => pressNumber(".")}>.</button>
    </div>
  {/if}
</div>
</div>

<style>
  .calc {
    background: rgb(15 23 42 / 0.6);
    border: 1px solid rgb(51 65 85 / 0.5);
    border-radius: 0.75rem;
    backdrop-filter: blur(12px);
  }

  .calc-inner {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    outline: none;
  }

  .calc-inner:focus-visible {
    border-color: rgb(59 130 246);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 0.25);
  }

  .display {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0.5rem 0.75rem;
    background: rgb(2 6 23 / 0.7);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    min-height: 2.5rem;
  }

  .display-text {
    flex: 1;
    text-align: right;
    color: rgb(241 245 249);
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    font-size: max(1rem, calc(var(--widget-unit, 0.16rem) * 55));
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .history-toggle {
    flex-shrink: 0;
    margin-left: 0.5rem;
    width: 1.6rem;
    height: 1.6rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgb(30 41 59);
    color: rgb(148 163 184);
    border: 1px solid rgb(71 85 105);
    border-radius: 9999px;
    cursor: pointer;
    padding: 0;
  }

  .history-toggle:hover {
    background: rgb(51 65 85);
    color: rgb(226 232 240);
  }

  .history-toggle.active {
    background: rgb(59 130 246);
    color: white;
    border-color: rgb(96 165 250);
  }

  .buttons {
    flex: 1;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    grid-auto-rows: 1fr;
    gap: 0.4rem;
    min-height: 0;
  }

  .btn {
    min-width: 0;
    min-height: 0;
    padding: 0;
    font-size: max(0.8rem, calc(var(--widget-unit, 0.16rem) * 38));
    font-weight: 600;
    color: rgb(226 232 240);
    background: rgb(30 41 59);
    border: 1px solid rgb(51 65 85);
    border-radius: 0.4rem;
    cursor: pointer;
    transition: background 100ms ease, transform 60ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .btn:hover {
    background: rgb(51 65 85);
  }

  .btn:active {
    transform: scale(0.96);
  }

  .calc-inner.round .btn {
    border-radius: 9999px;
    aspect-ratio: 1 / 1;
  }

  .zero {
    grid-column: span 2;
  }

  .calc-inner.round .zero {
    aspect-ratio: auto;
    border-radius: 9999px;
  }

  .op.colored {
    background: rgb(59 130 246);
    color: white;
    border-color: rgb(96 165 250);
  }
  .op.colored:hover {
    background: rgb(37 99 235);
  }

  .eq.colored {
    background: rgb(34 197 94);
    color: white;
    border-color: rgb(74 222 128);
  }
  .eq.colored:hover {
    background: rgb(22 163 74);
  }

  .clear.colored {
    background: rgb(127 29 29);
    color: white;
    border-color: rgb(185 28 28);
  }
  .clear.colored:hover {
    background: rgb(153 27 27);
  }

  .history {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border: 1px solid rgb(51 65 85);
    border-radius: 0.5rem;
    background: rgb(2 6 23 / 0.5);
    overflow: hidden;
  }

  .history-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.4rem 0.6rem;
    border-bottom: 1px solid rgb(51 65 85);
    background: rgb(15 23 42 / 0.6);
  }

  .history-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgb(148 163 184);
    font-weight: 600;
  }

  .history-clear {
    font-size: 0.7rem;
    padding: 0.2rem 0.5rem;
    background: transparent;
    color: rgb(148 163 184);
    border: 1px solid rgb(71 85 105);
    border-radius: 0.25rem;
    cursor: pointer;
  }

  .history-clear:hover:not(:disabled) {
    background: rgb(51 65 85);
    color: rgb(226 232 240);
  }

  .history-clear:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .history-list {
    flex: 1;
    overflow-y: auto;
    padding: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .history-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    font-size: 0.75rem;
    color: rgb(100 116 139);
  }

  .history-entry {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 0.35rem 0.6rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 0.3rem;
    cursor: pointer;
    text-align: right;
  }

  .history-entry:hover {
    background: rgb(15 23 42);
    border-color: rgb(51 65 85);
  }

  .history-expression {
    font-size: 0.7rem;
    color: rgb(148 163 184);
    font-variant-numeric: tabular-nums;
  }

  .history-result {
    font-size: 0.85rem;
    color: rgb(241 245 249);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>

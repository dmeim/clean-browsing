# Widget Development Guide

This guide covers how to build a new widget for Clean Browsing. It assumes
you've already read [`docs/README.md`](README.md) and have a working
`npm run dev` loop.

The canonical reference is the clock widget under `src/lib/widgets/clock/`.
Read it alongside this guide.

## The Shape of a Widget

A widget is a folder under `src/lib/widgets/` containing three files:

```
src/lib/widgets/<id>/
├── <Name>.svelte          # what the user sees on the grid
├── <Name>Settings.svelte  # the settings form in the per-widget dialog
└── definition.ts          # types + metadata + registerWidget() call
```

Plus a one-line side-effect import in `src/lib/widgets/index.ts`:

```ts
import "./<id>/definition.js";
```

That's the whole contract. No HTML changes, no script tags, no build config.

## Step-by-Step: Building a "Counter" Widget

Let's walk through creating a trivial counter widget to see every piece.

### 1. Create the folder

```
src/lib/widgets/counter/
├── Counter.svelte
├── CounterSettings.svelte
└── definition.ts
```

### 2. `definition.ts` — metadata + registration

```ts
import type { WidgetDefinition } from "$lib/widgets/types.js";
import { registerWidget } from "$lib/widgets/registry.js";
import Counter from "./Counter.svelte";
import CounterSettings from "./CounterSettings.svelte";

export type CounterSettings = {
  label: string;
  start: number;
  step: number;
};

export const counterDefinition: WidgetDefinition<CounterSettings> = {
  id: "counter",
  name: "Counter",
  description: "Click-to-increment counter with a configurable step",
  component: Counter,
  settingsComponent: CounterSettings,
  defaultSize: { w: 3, h: 2 },
  minSize: { w: 2, h: 1 },
  defaultSettings: {
    label: "Count",
    start: 0,
    step: 1,
  },
};

registerWidget(counterDefinition);
```

Key points:

- `id` is the string the grid store uses to look up the definition. It must
  be unique across the registry. Use kebab-case.
- `TSettings` is your per-instance settings shape. The whole widget is
  generically typed against it — TS will catch mismatches between the
  widget component, settings form, and `defaultSettings`.
- `defaultSize` / `minSize` / `maxSize` are in grid cells, not pixels. The
  default grid is 24 columns × 16 rows.
- Note the `.js` extensions in import specifiers — required by `NodeNext`
  module resolution.

### 3. `Counter.svelte` — the rendered widget

```svelte
<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { CounterSettings } from "./definition.js";

  let { settings }: WidgetProps<CounterSettings> = $props();

  let count = $state(settings.start);

  function bump() {
    count += settings.step;
  }
</script>

<div class="widget-card counter">
  <div class="widget-inner">
    <div class="label">{settings.label}</div>
    <button type="button" onclick={bump}>{count}</button>
  </div>
</div>

<style>
  .counter .widget-inner {
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
  }

  .counter .label {
    font-size: 0.75rem;
    color: var(--ui-muted-fg);
  }

  .counter button {
    font-size: 1.5rem;
    font-variant-numeric: tabular-nums;
    color: var(--widget-accent, inherit);
    background: transparent;
    border: none;
    cursor: pointer;
  }
</style>
```

Key points:

- Props come from `$props()` typed as `WidgetProps<CounterSettings>`. You
  always receive `settings` and `updateSettings` — use `updateSettings`
  only if the widget needs to persist state across reloads (our counter
  resets to `start` on every mount, which is fine for this example).
- Wrap the widget in `.widget-card` and put content inside `.widget-inner`.
  The card receives all the shared visual chrome (background, border, blur,
  shadow, opacity, border-radius) via CSS variables set by `GridItem.svelte`.
  Don't override those unless your widget really needs to.
- Use `var(--widget-accent, ...)` for the primary color so the widget
  respects the user's per-instance appearance overrides.
- `<style>` blocks are scoped. Reach for Tailwind utilities first; use a
  `<style>` block when you need container queries, pseudo-elements, or
  something utilities can't express.

### 4. `CounterSettings.svelte` — the settings form

```svelte
<script lang="ts">
  import type { WidgetSettingsProps } from "$lib/widgets/types.js";
  import type { CounterSettings } from "./definition.js";

  let { settings, updateSettings }: WidgetSettingsProps<CounterSettings> =
    $props();

  function patch(partial: Partial<CounterSettings>) {
    updateSettings({ ...settings, ...partial });
  }
</script>

<div class="space-y-3">
  <label class="block text-sm">
    <span class="mb-1 block">Label</span>
    <input
      type="text"
      class="w-full rounded border px-2 py-1"
      value={settings.label}
      oninput={(e) => patch({ label: e.currentTarget.value })}
    />
  </label>

  <label class="block text-sm">
    <span class="mb-1 block">Step</span>
    <input
      type="number"
      class="w-full rounded border px-2 py-1"
      value={settings.step}
      oninput={(e) => patch({ step: Number(e.currentTarget.value) || 1 })}
    />
  </label>
</div>
```

Key points:

- Same `$props()` shape as the widget, plus `updateSettings`. Every call
  to `updateSettings(next)` is persisted synchronously by the grid store.
- The pattern for partial updates is `updateSettings({ ...settings, ...partial })`.
  There's no helper for this because it's a one-liner.
- For complex forms, prefer the shadcn-svelte primitives under
  `src/lib/components/ui/` (Input, Dialog pieces, etc.) — they handle
  focus traps and keyboard a11y.

### 5. Register at startup

Add one line to `src/lib/widgets/index.ts`:

```ts
import "./counter/definition.js";
```

Order doesn't matter — the registry is a plain `Map` keyed by `id`.

### 6. Run it

```bash
npm run dev
```

Open a new tab, enter edit mode (✎ button in the toolbar), click "Add
Widget," and the Counter appears in the list. Drop it on the grid, open
its settings, change the label — done.

## The `WidgetDefinition<TSettings>` Shape

From `src/lib/widgets/types.ts`:

```ts
export type WidgetDefinition<TSettings = unknown> = {
  id: string;
  name: string;
  description?: string;
  component: Component<WidgetProps<TSettings>>;
  settingsComponent?: Component<WidgetSettingsProps<TSettings>>;
  defaultSize: GridSize;
  minSize?: GridSize;
  maxSize?: GridSize;
  defaultSettings: TSettings;
};

export type WidgetProps<TSettings = unknown> = {
  settings: TSettings;
  updateSettings: (next: TSettings) => void;
};
```

- `settingsComponent` is optional — a widget without per-instance settings
  can omit it, and the "Widget Settings" button will just not appear.
- `defaultSettings` is required even if it's `{}`. TypeScript infers
  `TSettings` from this field if you don't pass the generic explicitly.
- `GridSize` is `{ w: number; h: number }` in cells.

## Common Patterns

### Timers and intervals

Use `$effect` with a returned cleanup function. Svelte 5 runs the cleanup
when the effect re-runs or the component unmounts.

```ts
let now = $state(new Date());

$effect(() => {
  const id = setInterval(() => {
    now = new Date();
  }, 1000);
  return () => clearInterval(id);
});
```

Never push intervals onto a global list — the rune lifecycle handles cleanup
for you.

### Responding to settings changes

Reactive derivations read from `settings.*` directly; Svelte re-runs the
derivation when props change.

```ts
const formatted = $derived.by(() => {
  const locale = settings.locale === "auto" ? navigator.language : settings.locale;
  return new Intl.DateTimeFormat(locale).format(now);
});
```

### Legacy instances with missing fields

When you add a new field to `TSettings`, existing instances in
`browser.storage.local` won't have it. The clock widget handles this with
nullish coalescing:

```ts
const dst = settings.daylightSavings ?? true;
```

Do this inside `$derived` or right at the use site — don't try to mutate
the incoming `settings` object.

### Fitting text to the widget size

`src/lib/grid/fitText.ts` is a Svelte action that scales text to fill
its container as the user resizes the widget:

```svelte
<span class="time" use:fitText>{timeString}</span>
```

Use it for any widget whose primary content is a single text node that
should dominate the cell (clock, date, counter).

### Padding sliders

If your widget exposes `paddingV` / `paddingH` settings, apply them as
inline styles on `.widget-inner`:

```svelte
<div
  class="widget-inner"
  style="top: {padV}px; bottom: {padV}px; left: {padH}px; right: {padH}px;"
>
  …
</div>
```

Edit mode renders a dashed outline around `.widget-inner` so users can see
what the padding sliders do.

## Naming and Conventions

- **Widget id**: kebab-case (`counter`, `top-sites`, `currency-converter`).
  Must be unique in the registry.
- **Folder name**: matches the id (`src/lib/widgets/counter/`).
- **Component filenames**: PascalCase (`Counter.svelte`, `CounterSettings.svelte`).
- **Settings type name**: `<Name>Settings` (e.g. `CounterSettings`).
- **Definition export**: `<name>Definition` (e.g. `counterDefinition`).
- **Import specifiers**: always include `.js` extension.

## What You Don't Need to Do

- ❌ Register the widget in a global `settings.widgets` array — the grid store
  handles that when the user drops the widget on the grid.
- ❌ Call `saveAndRender()` / `persist()` manually — `updateSettings` goes
  through the grid store which persists automatically.
- ❌ Wire up drag and resize — `GridItem.svelte` handles that for every widget
  uniformly.
- ❌ Add a `<script src="...">` to any HTML file — Vite bundles everything.
- ❌ Set widget background/border/radius/shadow — those come from the global
  defaults + per-instance overrides via CSS variables on `.grid-item-inner`.

## Troubleshooting

**Widget doesn't appear in the Add Widget dialog.**
Did you add the `import "./<id>/definition.js";` line to
`src/lib/widgets/index.ts`? If not, the definition module never runs, and
`registerWidget` is never called.

**"Widget X is already registered — overwriting" in the console.**
Two widgets share the same `id`. Pick a unique one.

**Settings don't persist.**
Make sure you call `updateSettings(next)` with a *new* object, not a mutation
of `settings`. The grid store persists on every call; if you're mutating in
place, Svelte won't see the change.

**`svelte-check` complains about `bits-ui` namespace exports.**
Those 2 errors in `src/lib/components/ui/button/index.ts` are pre-existing
and unrelated to your widget. They don't break the build.

**The widget renders but its content is cut off at the corners.**
You're probably overriding `border-radius` on `.widget-card` — don't. The
card gets `border-radius` from `--widget-border-radius` automatically, and
`overflow: hidden` clips inner content to that radius. Set your own inner
layout, not the outer card's shape.

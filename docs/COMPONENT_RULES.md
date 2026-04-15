# Component Rules

Architectural conventions for components and stores in Clean Browsing. These
are rules for how things are _organized_, not how they're styled — see
[`STYLING_GUIDE.md`](STYLING_GUIDE.md) for Tailwind/CSS conventions.

## 1. Stores are runes, never `svelte/store`

Every store in this codebase is a **factory function returning getters and
mutators**, using Svelte 5 runes internally. We do not use `writable()`,
`readable()`, or `derived()` from `svelte/store` — those are legacy patterns
from Svelte 3/4 and don't compose with runes.

### Store shape

```ts
// src/lib/ui/uiStore.svelte.ts
function createUiStore() {
  let editMode = $state(false);
  let settingsOpen = $state(false);

  function toggleEditMode() {
    editMode = !editMode;
  }

  return {
    get editMode() {
      return editMode;
    },
    get settingsOpen() {
      return settingsOpen;
    },
    toggleEditMode,
    // ...
  };
}

export const uiStore = createUiStore();
```

Consumers read fields via the getters and call the exposed functions to
mutate. The rune system propagates changes to every dependent `$derived` /
`$effect` / template binding.

### Why getters?

Returning raw `$state` variables from a function would break reactivity at
the boundary — the caller would get a snapshot. Getters defer the read
until the consumer actually accesses the field, which is when Svelte
registers the dependency.

### Three stores to know

- **`src/lib/grid/store.svelte.ts`** — single source of truth for layout.
  Owns the `GridLayout` (cols, rows, instances), exposes `addWidget`,
  `moveWidget`, `resizeWidget`, `canPlace`, `findFreeSlot`, `removeWidget`,
  `updateWidgetSettings`, `resetLayout`. Persists to `browser.storage.local`
  under `clean-browsing:layout:v2` (falls back to `localStorage` when not
  running as an extension). Handles one-time migration from the legacy
  `localStorage` key.
- **`src/lib/ui/uiStore.svelte.ts`** — ephemeral UI state: `editMode`,
  `settingsOpen`, `addWidgetOpen`, `widgetSettingsInstanceId`. Not persisted.
- **`src/lib/settings/store.svelte.ts`** — global settings (theme, widget
  defaults, background, etc.) with its own migration hooks and persistence.

New stores follow the same pattern. **Do not** introduce `svelte/store`
writables; **do not** return the `$state` variable directly.

## 2. Component prop conventions

All components use `$props()` destructuring with a TypeScript type annotation:

```svelte
<script lang="ts">
  import type { WidgetProps } from "$lib/widgets/types.js";
  import type { ClockSettings } from "./definition.js";

  let { settings, updateSettings }: WidgetProps<ClockSettings> = $props();
</script>
```

- No legacy `export let` declarations anywhere.
- No positional props. Always named.
- For widgets specifically, use `WidgetProps<TSettings>` and
  `WidgetSettingsProps<TSettings>` from `$lib/widgets/types.js` so the
  generic binding stays consistent.

## 3. Reactive state, derivations, effects

- **`$state(...)`** — mutable reactive state local to a component or store.
- **`$derived(expr)`** — cached computation from other reactive values. Use
  the `$derived.by(() => ...)` form for multi-statement derivations.
- **`$effect(() => { ...; return cleanup; })`** — imperative side effects
  (timers, subscriptions, DOM APIs that can't be expressed declaratively).
  **Always return a cleanup function** when you set up anything that needs
  to be torn down. The effect re-runs on dependency change and cleans up
  automatically; you never need a global `activeIntervals` list.

### Example: interval that cleans up

```ts
let now = $state(new Date());

$effect(() => {
  const id = setInterval(() => {
    now = new Date();
  }, 1000);
  return () => clearInterval(id);
});
```

### Do not

- ❌ Use `$:` reactive statements (Svelte 3/4 legacy).
- ❌ Mutate a `$derived` value — derivations are read-only.
- ❌ Call `$state` or `$derived` outside the top level of a component or a
  `.svelte.ts` store file.

## 4. The widget registry pattern

Widgets do not import each other. They do not touch the grid store directly.
They register themselves with the registry at module load, and the grid
looks them up by `widgetId`.

```ts
// src/lib/widgets/<id>/definition.ts
export const myDefinition: WidgetDefinition<MySettings> = {
  /* ... */
};
registerWidget(myDefinition);
```

```ts
// src/lib/widgets/index.ts
import "./clock/definition.js";
import "./date/definition.js";
import "./my/definition.js"; // add your widget here
```

`src/lib/widgets/index.ts` side-effect-imports every definition before the
grid renders for the first time. Order doesn't matter — the registry is a
plain `Map` keyed by `id`.

### Rules

- A widget's `definition.ts` is the **only** file allowed to import its
  own `.svelte` components and call `registerWidget`.
- Widgets do not import from other widgets. If two widgets need to share
  code, lift it to `src/lib/widgets/style/`, `src/lib/grid/`, or a new
  `src/lib/common/` folder.
- The grid store holds `WidgetInstance` objects with `widgetId`, `x`, `y`,
  `w`, `h`, and an untyped `settings: unknown`. The widget definition
  provides the type. `GridItem.svelte` looks up the definition via
  `getWidget(instance.widgetId)` and renders
  `<def.component settings={...} updateSettings={...} />`.

## 5. Persistence contract

- **Layout**: `browser.storage.local` key `clean-browsing:layout:v2`.
  The entire `GridLayout` is serialized as one JSON blob. Widget settings
  live inside `WidgetInstance.settings`.
- **Global settings**: a separate key owned by `settings/store.svelte.ts`.
- **Image library**: IndexedDB via `src/lib/storage/idb.ts`, exposed through
  `src/lib/storage/imageLibrary.svelte.ts`. Large binary data goes here,
  not in `browser.storage.local`.

When you add a new field to `TSettings` or the global settings type, **read
with nullish coalescing** (`settings.newField ?? default`) so existing
instances don't crash. Migrations that mutate stored state live in the
store's `load()` path.

## 6. Component ownership

### Grid is a closed system

- `src/lib/grid/Grid.svelte` renders the CSS grid and iterates
  `gridStore.layout.instances`.
- `src/lib/grid/GridItem.svelte` is the only component that handles pointer
  drag/resize. It reads cell stride from the parent's computed grid template,
  handles pointer capture, and calls `gridStore.moveWidget` / `resizeWidget`.

Widgets should **not** try to handle their own drag, resize, or positioning.
If you need the widget to react to being dragged/resized, read from the
grid store — don't wire pointer events inside the widget.

### UI shell is a closed system

- `src/lib/ui/Toolbar.svelte` is the single toolbar. New buttons go here.
- Dialogs live in `src/lib/ui/{Settings,AddWidget,WidgetSettings}Dialog.svelte`
  and are opened/closed via `uiStore`. Never use `window.alert` / `confirm`
  or push a new dialog file per widget — per-widget settings already route
  through `WidgetSettingsDialog` which looks up the widget's
  `settingsComponent`.
- Toast notifications: `svelte-sonner`. Import `toast` from it.

## 7. Imports and paths

- **`$lib` alias** for every cross-folder import: `import { x } from "$lib/ui/uiStore.svelte.js"`.
- **`.js` extension on specifiers** (TS will still resolve the `.ts` file).
  Required by `tsconfig.json`'s `module: "NodeNext"`.
- Type imports use `import type`:
  ```ts
  import type { WidgetProps } from "$lib/widgets/types.js";
  ```
- shadcn-svelte primitives live under `src/lib/components/ui/` — never
  reach into `bits-ui` directly; always go through the shadcn wrappers.

## 8. Error handling

- **At system boundaries**, validate. (User input, parsed storage blobs,
  URL parameters, etc.) The grid store's `loadRaw()` catches JSON parse
  errors and logs them; follow that pattern.
- **Inside trusted internal code**, don't add defensive checks for states
  that can't happen. If `getWidget(id)` returns `undefined` in a place where
  the caller _just_ got the id out of the registry, wrapping it in
  `if (!def) return` is dead code.
- **Console noise**: use `console.warn` for recoverable issues (e.g.,
  "unknown widget id — skipping"), `console.error` for genuine bugs. Don't
  invent user-visible error UI unless there's an actual user action that
  could trigger it.

## 9. Accessibility baseline

- All interactive elements must be reachable by keyboard. Dialogs trap
  focus via shadcn-svelte / bits-ui — use those primitives.
- Buttons are `<button type="button">` unless they submit a form.
- Icons-only buttons need an `aria-label`.
- Color is not the only carrier of information (use text + color for
  errors, not color alone).

## 10. What components should not do

- ❌ Use `innerHTML` with user-controlled data (XSS risk). Use Svelte
  templating, which escapes by default.
- ❌ Touch the DOM outside their own subtree via `document.querySelector`.
  If a component needs to coordinate with another, go through a store.
- ❌ Introduce new global variables. The three stores (`gridStore`,
  `uiStore`, `settingsStore`) are the only legitimate globals.
- ❌ Mutate props. Props are inputs; use `updateSettings` or call a store
  mutator instead.
- ❌ Make network requests for cosmetic or incidental reasons. Clean
  Browsing is local-first by default: no telemetry, no fonts from a CDN,
  no analytics, no runtime icon fetching. The exception is widgets whose
  **core function requires network** (Weather fetching a forecast, a ping
  monitor hitting a URL, an embed loading its source). Those are allowed,
  but the rules are strict: opt-in via widget settings, disclosed clearly
  in the settings dialog and the privacy policy, scoped to the host
  permissions the widget actually needs, and never firing network calls
  on page load before the user has configured the widget. If a non-widget
  component wants to make a network call, that's still a discussion
  before a PR.

---

If a rule here conflicts with what you see in the codebase, the codebase
wins and this doc needs updating — file a PR.

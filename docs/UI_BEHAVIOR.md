# UI Behavior

How the Clean Browsing UI actually behaves — edit mode, drag/resize, dialogs,
and the interaction patterns a contributor needs to know to ship a
coherent-feeling change.

This reflects the **current Svelte 5 codebase**. A prior version of this
file documented the legacy vanilla-JS extension, preserved at the
`legacy-final` git tag.

## The Two Modes

Clean Browsing has exactly two modes at the new-tab page level, tracked by
`uiStore.editMode`:

### View Mode (default)

- Widgets render normally on the 24×16 grid.
- No drag, no resize, no delete buttons, no jiggle.
- Interactive widgets (calculator buttons, search input) receive clicks
  and keystrokes directly.
- The toolbar floats with the edit (✎), add-widget (+), settings (⚙), and
  theme (☀/🌙) buttons.

### Edit Mode

Toggled by the ✎ button in the toolbar. `uiStore.toggleEditMode()` flips
`editMode` on the UI store; the grid and its children react.

In edit mode:

- Every `GridItem` gets an `edit-mode` class and starts showing its inner
  dashed padding outline.
- Pointer down on a widget **starts a drag** instead of passing the click
  through to widget content.
- Resize handles become active on the south, east, and southeast edges.
- Per-widget settings and delete affordances become available.
- Exiting edit mode closes any open Add Widget / per-widget Settings dialog
  (`uiStore.exitEditMode()`), but does _not_ close the global Settings
  dialog — that's independent.

The edit mode toggle is the gating input for every "structural" operation.
Widget-internal state (calculator memory, etc.) is not affected.

## Drag and Resize

All drag/resize logic lives in `src/lib/grid/GridItem.svelte`. Widgets do
not implement their own — it's uniform across every widget.

### The math

- The grid is `grid-template-columns: repeat(cols, 1fr)` /
  `grid-template-rows: repeat(rows, 1fr)` with a gap.
- On pointer down, `GridItem` reads the parent's computed `gridTemplateColumns`
  and `gridTemplateRows` to compute cell stride (cell size + gap).
- During pointer move, the delta in pixels is divided by the stride to get
  a delta in cells.
- The preview position follows the cursor freely — the widget visually
  floats over other tiles rather than fighting for placement.
- `gridStore.canPlace(instanceId, x, y, w, h)` validates each hovered cell
  against grid bounds and rectangle overlap with every other instance
  (skipping the caller's own instance so it can "move in place"). Invalid
  hover spots get a red outline on the floating widget.
- On pointer up, the current cell is committed if valid; otherwise the
  item snaps back to the last valid position. There is no "drop and fail"
  state — every drag always ends in a valid cell.

### Resize

Resize uses the same stride math, read from `GridItem`'s edges:

- **South edge** — height only, `s-resize` cursor.
- **East edge** — width only, `e-resize` cursor.
- **Southeast corner** — both dimensions, `se-resize` cursor.

Resize is bounded by the widget's `minSize` / `maxSize` (from its
`WidgetDefinition`) and by `canPlace`.

### Pointer capture

`GridItem` uses `setPointerCapture()` on the drag element so the drag
continues even if the pointer leaves the widget bounds. This is why drag
still works when you fling a widget off-screen and pull it back.

### Touch

Pointer events cover touch by default — no separate touch handler. Drag
works on a touchscreen, but the fine-grained resize handles are small;
touch users should lean on the corner handle, not the edges.

## Dialogs

Three dialogs, all built from shadcn-svelte primitives:

### 1. Settings Dialog — `src/lib/ui/SettingsDialog.svelte`

Global settings: theme, widget appearance defaults, background, image
library, storage. Opens via the ⚙ button in the toolbar.
`uiStore.settingsOpen` controls visibility. Tabs inside the dialog use
shadcn-svelte tabs and the local `settings/*.svelte` panels.

### 2. Add Widget Dialog — `src/lib/ui/AddWidgetDialog.svelte`

Lists every registered widget via `listWidgets()` from the registry.
Clicking one calls `gridStore.addWidgetAuto(id)`, which finds the first
free slot on the grid using the widget's `defaultSize`. Opens via the +
button in edit mode. `uiStore.addWidgetOpen` controls visibility.

### 3. Per-Widget Settings Dialog — `src/lib/ui/WidgetSettingsDialog.svelte`

Opens via a per-widget control when the user wants to configure a specific
instance. Looks up the widget's `settingsComponent` from the registry and
renders it with the instance's `settings` and a wrapped `updateSettings`
that calls `gridStore.updateWidgetSettings(instanceId, next)`.
`uiStore.widgetSettingsInstanceId` holds the target instance (or `null`
when closed).

### Dialog conventions

- Always use shadcn-svelte primitives under `src/lib/components/ui/dialog/`.
  They handle focus trapping, Escape-to-close, and overlay click behavior.
- Dialogs close on Escape by default.
- Clicking outside a modal dialog closes it; clicking inside doesn't.
- Only one dialog is open at a time. If you need to open a new one,
  close the current one first via the `uiStore` setter.

## Toolbar

`src/lib/ui/Toolbar.svelte` is the **only** toolbar. Every top-level
interactive affordance lives there — edit mode, add widget, settings,
theme toggle. Don't scatter floating buttons across the page.

Buttons follow shadcn-svelte's `Button` variant system. Icon-only buttons
require an `aria-label`.

## Toasts

Toast notifications use **`svelte-sonner`**. Import `toast` and call it
for transient feedback (successes, non-blocking errors, undo prompts).

```ts
import { toast } from "svelte-sonner";

toast.success("Layout reset");
toast.error("Could not load image");
```

Do **not** use `alert()` / `confirm()`. For destructive confirmations,
open a small shadcn-svelte Dialog with explicit Cancel / Confirm buttons.

## Keyboard Behavior

- **Escape** — close the current dialog.
- **Tab / Shift+Tab** — standard focus movement; shadcn-svelte primitives
  trap focus inside dialogs.
- **Enter** — activate focused button, submit focused input where
  appropriate.
- **Space** — toggle focused checkboxes and buttons.

Widget-internal keyboard handling is the widget's own responsibility. For
example, the search widget captures Enter to submit.

There are currently no global keyboard shortcuts for edit mode or dialogs.
If you add one, put the binding in `App.svelte` and make sure it doesn't
fire while an `<input>` has focus.

## Light / Dark Theme

- `mode-watcher` owns the `.dark` class on `<html>`.
- The theme toggle in `Toolbar.svelte` flips it through `mode-watcher`'s
  API, not by setting classes directly.
- Every `--ui-*` variable has a light and dark value in `src/app.css`.
  Widget chrome variables pick up their theme-aware defaults from the
  global widget appearance store.

Widgets that need theme awareness should read from CSS variables
(`--ui-fg`, `--widget-accent`), not from a JS flag. That way a live theme
switch is instant and zero JS.

## Error and Loading States

### Loading

- The grid store's `load()` is async; `loaded` becomes `true` on resolve.
  `Grid.svelte` should not render items until `loaded` — empty grid is
  fine as a loading state, or a subtle "Loading…" in the toolbar.

### Errors

- Transient errors use `svelte-sonner` toasts.
- Unknown widget types in stored layouts log a `console.warn` in the
  registry lookup and are skipped from render. We don't show a user-visible
  error — the widget just doesn't appear. If this starts happening to real
  users, reconsider.
- Storage write failures are rare (`browser.storage.local` has a
  `unlimitedStorage` permission) but should log and surface a toast if
  they do happen.

## Accessibility Baseline

- Every interactive element is keyboard-reachable.
- Every icon-only button has an `aria-label`.
- Color is not the only carrier of information — success/error/warning
  use an icon + text, not color alone.
- Focus ring is always visible on `:focus-visible` (see `--ui-focus` in
  `STYLING_GUIDE.md`).
- Dialogs trap focus and return it to the trigger on close. (shadcn-svelte
  handles this for you.)

## Performance

- Prefer CSS transitions (`transform`, `opacity`) over JS-driven animation.
- Never put a `setInterval` in a component without a matching cleanup in
  `$effect`'s returned function — leaked timers compound across edit-mode
  toggles.
- Widget layout computations (fitText, widgetScaler) read from
  `ResizeObserver` rather than polling.
- If a widget does heavy work, debounce it inside the widget — don't push
  that concern into the grid or the store.

## The Spirit of the UI

If you're about to add a new piece of UI, ask:

1. **Does it need to live in the toolbar, a dialog, or inline on a widget?**
   Inline edits should be rare and obviously local to a single widget.
2. **Does it work in both view mode and edit mode?** If yes, prefer the
   toolbar. If it's structural (add, remove, move), it belongs behind
   edit mode.
3. **Is there already a shadcn-svelte primitive for it?** Use that before
   writing a custom component.
4. **Does it respect the "no network" rule?** No fonts from a CDN, no
   telemetry, no fetching icons at runtime.
5. **Does it have a light and a dark treatment?** If you're hardcoding a
   color, stop and find (or add) a CSS variable.

When in doubt, mimic the clock widget + toolbar + SettingsDialog trio —
they embody the conventions this doc describes.

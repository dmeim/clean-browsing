# Styling Guide

How styling works in Clean Browsing: Tailwind v4, shadcn-svelte, a small
set of design-token CSS variables, and light/dark theming via `mode-watcher`.

This doc describes the **current Svelte 5 codebase**. A prior version of
this file documented the legacy vanilla-JS glassmorphism system, preserved
at the `legacy-final` git tag.

## 1. Tailwind v4, no config file

Tailwind v4 is loaded once via `src/app.css`:

```css
@import "tailwindcss";
```

The `@tailwindcss/vite` plugin in `vite.config.ts` wires it into the build.
There is **no `tailwind.config.js`**, **no PostCSS config**, and **no content
globs** — Tailwind v4 scans source files automatically.

Consequence: to expose a new color as a utility class, you must declare it
in the `@theme inline { ... }` block in `src/app.css` so Tailwind knows
about it at scan time. Silently referencing `bg-something` without a token
compiles to nothing.

## 2. Design tokens live in `src/app.css`

All design tokens — colors, surfaces, UI chrome, widget chrome — are CSS
custom properties defined at `:root` and overridden under `.dark`.

Three families:

### Brand palette (both modes)

```css
--brand-orange: #eda95d;
--brand-green:  #95c69d;
--brand-blue:   #8dafdb;
--brand-lilac:  #cdbfd2;
```

Sampled from the logo (`public/icons/logo.png`). Use these for on-brand
accents — highlights, illustrations, status chips, focus rings.

### shadcn-svelte HSL tokens

```css
--background, --foreground,
--card, --card-foreground,
--popover, --popover-foreground,
--primary, --primary-foreground,
--secondary, --secondary-foreground,
--muted, --muted-foreground,
--accent, --accent-foreground,
--destructive, --destructive-foreground,
--border, --input, --ring,
--radius
```

Stored as space-separated HSL components (`222.2 84% 4.9%`) so they can
be consumed with alpha via `hsl(var(--foreground) / 0.5)`. The `@theme inline`
block at the top of `app.css` wraps these into Tailwind color utilities:
`bg-background`, `border-border`, `text-foreground`, etc.

### UI and widget variables

This is the project-specific layer. Naming convention: **`--ui-*`**,
**`--shell-*`**, **`--surface-*`**, **`--widget-*`**. Never use `--chrome-*`
— "chrome" reads as the browser (this is a Firefox extension).

Most commonly used:

```css
--ui-page-bg         /* whole-page background gradient */
--ui-page-fg         /* default page foreground */
--ui-fg              /* body text */
--ui-muted-fg        /* secondary text */
--ui-subtle-fg       /* tertiary / hint text */
--ui-panel-bg        /* dialog / settings panel backgrounds */
--ui-panel-border
--ui-btn-bg
--ui-btn-bg-hover
--ui-btn-fg
--ui-btn-fg-strong
--ui-btn-border
--ui-input-bg
--ui-subtle-bg
--ui-subtle-bg-hover
--ui-inset-bg
--ui-deep-bg
--ui-border-soft
--ui-accent          /* usually --brand-blue */
--ui-accent-hover
--ui-accent-fg
--ui-accent-soft-bg
--ui-accent-soft-border
--ui-accent-soft-fg
--ui-focus           /* focus ring color */
--ui-success         /* --brand-green in dark */
--ui-warning         /* --brand-orange in dark */
--ui-error
--ui-danger-bg / --ui-danger-bg-hover / --ui-danger-border / --ui-danger-fg
--ui-badge-bg / --ui-badge-fg / --ui-badge-border
```

Widget visual chrome is a separate family, set **per-instance** on
`.grid-item-inner` by `GridItem.svelte` (not statically in CSS):

```css
--widget-bg
--widget-border-color
--widget-border-width
--widget-border-style
--widget-border-radius
--widget-backdrop-blur
--widget-box-shadow
--widget-text
--widget-accent
--widget-opacity
```

These are merged from the global widget defaults + per-instance overrides.
**Widgets should read these variables, not declare their own values.**

## 3. Light / dark mode

Two theme states, managed by `mode-watcher`:

- **Light** — defined at `:root` in `src/app.css`
- **Dark** — defined under `.dark`, toggled by adding the `dark` class to
  `<html>`

Every `--ui-*` and most shadcn tokens are redefined under `.dark`. Widget
tokens follow via `--widget-*` defaults in the global widget appearance
store.

When you add a new `--ui-*` variable, **always add both light and dark
values** in `src/app.css`. Single-mode tokens break theme switching.

## 4. Widget card shell

Every widget component renders:

```svelte
<div class="widget-card …">
  <div class="widget-inner" style="top: …; bottom: …; left: …; right: …">
    <!-- widget content -->
  </div>
</div>
```

The `.widget-card` / `.widget-inner` rules in `src/app.css` handle:

- Background / border / radius / blur / shadow / opacity via the `--widget-*`
  variables.
- `overflow: hidden` on the card so content is clipped to the (dynamic)
  border radius.
- A dashed outline on `.widget-inner::before` in edit mode so users can
  see what the padding sliders are doing.

Widgets should not override `.widget-card`'s background, border, border-radius,
box-shadow, or opacity. They should set their own **inner layout** (flex,
grid, text sizing) on `.widget-inner` or child elements.

## 5. Utilities first, `<style>` blocks second

Order of preference:

1. **Tailwind utility classes** on the element.
2. **Scoped `<style>` block** inside the Svelte component, for:
   - Container queries (`container-type`, `@container`)
   - Keyframe animations
   - Pseudo-elements that don't compose well with utilities
   - Widget-internal layout that depends on `--widget-*` variables
3. **Globals in `src/app.css`** only for rules that must cross component
   boundaries (e.g., `.widget-card` + `.widget-inner`, `.dark` token overrides).

Avoid `!important`. If a utility isn't taking effect, the issue is usually
specificity from a `<style>` block — restructure the selector rather than
forcing the override.

## 6. Naming conventions

### CSS variables

- **`--brand-*`** — fixed brand palette, same in both themes
- **`--ui-*`** — app shell / UI chrome (buttons, panels, text, borders)
- **`--shell-*` / `--surface-*`** — reserved for related layers; use instead
  of "chrome" when you need a different word
- **`--widget-*`** — per-instance widget visual chrome (set dynamically by
  `GridItem.svelte`, not in `app.css`)
- **shadcn tokens** — bare names (`--background`, `--foreground`, etc.) as
  required by the shadcn-svelte templates

### Component classes

- Scope with Svelte's `<style>` block — no BEM, no global widget classes.
- When you need a class that escapes component scope, use `:global(...)`.

### Utility composition

For repeated class sets, use `tailwind-variants` or `clsx` + `tailwind-merge`
(already dependencies):

```ts
import { tv } from "tailwind-variants";

const button = tv({
  base: "rounded px-3 py-1",
  variants: {
    intent: {
      primary: "bg-primary text-primary-foreground",
      muted: "bg-muted text-muted-foreground",
    },
  },
});
```

Don't build your own variant helper — `tailwind-variants` is the project
standard.

## 7. Icons

All icons come from **`lucide-svelte`**. Import the component directly:

```svelte
<script lang="ts">
  import { Settings, Plus, X } from "lucide-svelte";
</script>

<button><Settings class="h-4 w-4" /></button>
```

Size with Tailwind utilities. No SVG sprite sheet, no custom icon system.

## 8. Accessibility and focus

- Focus ring uses `--ui-focus` (defaults to `--brand-blue`). All interactive
  elements must have a visible focus state — shadcn-svelte primitives handle
  this for you; custom buttons should use `focus-visible:ring-2 focus-visible:ring-[color:var(--ui-focus)]`
  or a similar utility.
- Text contrast: body text uses `--ui-fg`; secondary text uses `--ui-muted-fg`.
  Avoid stacking opacity on top of already-muted colors — it tanks contrast.
- Never remove focus outlines without providing a replacement.

## 9. Animation

- **Timing**: prefer short, snappy transitions for UI (150–250 ms) and
  slightly longer for widget layout changes (300–400 ms).
- **Easing**: Tailwind defaults (`ease-out`, `ease-in-out`) are fine. For
  custom curves, define them inline with `transition-timing-function`.
- **Hardware acceleration**: animate `transform` and `opacity`, not `top`
  or `width`.
- **Reduced motion**: respect `prefers-reduced-motion` for any decorative
  animation (jiggle, pulse). Use a `<style>` block with
  `@media (prefers-reduced-motion: reduce)` to disable it.

## 10. Never say "chrome"

Historical note that matters: Clean Browsing is a **Firefox extension**.
When we discuss styling, "chrome" always reads as the browser itself, not
window chrome. Use `--ui-*`, `--shell-*`, `--surface-*`, `--widget-*`
prefixes instead. This rule is enforced by convention (and by the memory
your future self is loading before each session).

# Group Widget (WIP)

> **Status:** :red_circle: Planned
>
> **Stage:** Design — significant grid-store changes required

## Overview

A container widget that holds other widgets inside it. Drop a Group on the grid, drag existing widgets into it, and they become a collapsible cluster. The group can be expanded (showing its children in a mini-grid) or collapsed (shrunk to a slim title bar, freeing the space below for other widgets). This is the first widget that introduces a parent-child relationship between instances, so it touches the grid store, collision detection, and drag-and-drop at a deeper level than any widget before it.

## Core behavior

### Inner grid

The Group widget's outer size is set by the user like any other widget (e.g. 10 x 10 grid cells). The inner area available to child widgets is always **the outer size minus 1 cell on every edge**: a 10 x 10 group has an 8 x 8 inner grid. This 1-cell buffer is structural — it is not affected by the widget's padding sliders and cannot be removed. It exists so the group's boundary is always visually distinct from a loose cluster of widgets that happen to sit next to each other.

Even when the padding sliders are set to 0 vertical / 0 horizontal, the buffer row/column remains. The Group widget renders a visible border, background tint, or subtle outline within this buffer so the user can always tell where the group starts and ends.

Inner cells are the same physical size as main-grid cells. A child widget that was 4 x 3 on the main grid is 4 x 3 inside the group — no scaling, no separate resolution.

### Collapse / expand

When collapsed, the group shrinks to a title bar. Its width stays the same; its height drops to **1 row** (enough for the label + an expand chevron). The space the group previously occupied below that row becomes free on the main grid — other widgets can be placed there.

When the user clicks expand:

1. The grid store probes downward (and sideways, if the group's configured width also can't fit) from the group's current position to determine how much of the group's **configured expanded size** is actually available — i.e. not blocked by other main-grid widgets.
2. If the full size fits, the group expands to that size. The inner area is **not scrollable** — every child widget is visible at its placed position.
3. If the full size does not fit (other widgets block part of the area), the group expands to the **largest available rectangle** anchored at its top-left corner, up to the configured size. The inner area becomes **vertically scrollable** so children that fall outside the visible inner rect can still be reached.

The configured expanded size (the "intended" size the user set before collapsing) is persisted in settings as `expandedH` / `expandedW`. Collapsing and expanding never changes these — only an explicit resize by the user does.

#### Example

> A Group is set to 10 x 10. It has children arranged inside the 8 x 8 inner grid. The user collapses it (now 10 x 1). They then place other widgets in the freed space so only 6 rows are available below the title bar. On expand, the group becomes 10 x 6. Its inner area is 8 x 4, but the children were laid out for 8 x 8 — so the inner area scrolls vertically. If the user later removes the blocking widgets, the next expand reclaims the full 10 x 10, and scrolling turns off.

### Dragging widgets into and out of the group

In edit mode:

- **Into the group:** dragging a main-grid widget over an expanded Group's inner area highlights a drop zone. On drop, the widget is adopted by the group: its coordinates are translated from main-grid space to group-inner space, and it is flagged as a child of this group.
- **Out of the group:** dragging a child widget past the group's boundary "undocks" it back to the main grid. Its coordinates translate from inner space back to main-grid space, and it is placed at the nearest free slot.
- **Within the group:** dragging a child widget inside the group repositions it within the inner grid. Collision detection is scoped to the group's children only.

When the group is collapsed, its children are not directly accessible for dragging. The user must expand the group first.

### Resizing

- **Resizing the Group itself** works like any other widget. The inner grid resizes accordingly (always outer minus 2 on each axis). If the new inner area is smaller than the space children occupy, children that fall outside are not removed — they remain in the inner grid and become reachable by scrolling.
- **Resizing a child widget** inside the group is constrained to the inner grid dimensions. The resize handle works the same as on the main grid, but collision checks are scoped to siblings within the group.

## Open design questions

1. **Where do children live in the data model?** Two options:

   **Option A — children in `layout.instances` with a `groupId` field.** Every child `WidgetInstance` gains an optional `groupId: string` pointing to the Group's `instanceId`. The child's `x, y, w, h` are relative to the group's inner grid. The main grid's `canPlace` skips instances that have a `groupId`. This is the more unified approach — one array, one persistence path — but it touches `WidgetInstance` and every function that iterates `layout.instances`.

   **Option B — children tracked in the Group's settings.** The Group's `settings.children` holds an array of `{ instanceId, innerX, innerY, innerW, innerH }` mappings, while the actual `WidgetInstance` objects remain in `layout.instances` with sentinel coordinates (e.g. `x: -1, y: -1`) so the main grid ignores them. Simpler for collision detection (children just aren't on the main grid), but splits positional data across two locations.

   **Lean preference: Option A.** It avoids split-brain between settings and layout and makes future features (e.g. nested groups, group-to-group transfer) more natural. The `groupId` field is optional and backward-compatible — existing layouts that lack it continue to work unchanged.

2. **Collapse direction.** The current design collapses vertically (height shrinks, width stays). Should horizontal collapse (width shrinks, height stays) also be supported? **Recommendation: vertical only for v1.** A horizontal collapse is conceptually the same but requires a different title-bar layout (rotated label or left-edge bar), which adds UI complexity for a niche use case.

3. **Nested groups.** Can a Group contain another Group? Technically, if `groupId` points to another Group instance, the data model allows it. But the UX quickly gets confusing (collapse a parent that contains a collapsed child?), and inner-grid collision detection would need to recurse. **Recommendation: disallow nesting for v1.** The "Add widget" dialog inside a group should not list Group as an option, and dragging a Group into another Group should be rejected.

4. **Title-bar content.** The 1-row collapsed state needs to show at least: the group label and an expand chevron. Should it also show a count of children? A summary of what's inside? **Lean preference: label + child count + chevron.** Keep it minimal — the point of collapsing is to reclaim space, not to display information.

5. **Expand animation.** Should the group animate open (rows growing from 1 to N) or snap? Animating is visually satisfying but means the grid layout is in flux during the transition, which complicates collision detection. **Recommendation: snap for v1.** Add animation later if it can be done without intermediate collision states.

6. **Maximum available rectangle calculation.** When expanding into partially blocked space, how does the store find the "largest available rectangle"? The simplest approach: starting from the group's top-left corner, expand rows downward one at a time, checking `canPlace` for the group's full width at each incremental height, and stop when blocked. This gives a greedy vertical expansion. A more sophisticated approach would also try narrowing the width to gain more height, but that changes the group's column span, which is confusing. **Lean preference: keep the configured width fixed; only the height flexes on expand.**

7. **Inner grid scrollbar visibility.** When the inner area is scrollable, should the scrollbar be always visible (clarifies that content is clipped) or hidden until hover (cleaner look)? **Lean preference: visible thin scrollbar track, auto-hiding thumb.** This signals "there's more" without cluttering the group.

8. **Minimum group size.** A group needs enough inner area to hold at least one reasonably sized child. A 3 x 3 group has a 1 x 1 inner area — barely usable. **Recommendation: minimum size of 4 x 4 (giving a 2 x 2 inner area).** This is the smallest useful container.

## Proposed widget ID & source layout

- **Widget ID:** `group`
- **Default size:** 8 x 8 (grid cells)
- **Minimum size:** 4 x 4
- **Collapsed size:** `{expandedW} x 1` (dynamic — width from settings, height locked to 1)
- **Source (proposed):** `src/lib/widgets/group/`
  - `Group.svelte` — renders title bar + inner grid + scrollable container
  - `GroupSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./group/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/group/definition.ts
export type GroupSettings = {
  label: string;
  collapsed: boolean;
  expandedW: number; // configured expanded width in grid cells
  expandedH: number; // configured expanded height in grid cells
  paddingV: number;
  paddingH: number;
};
```

The Group widget's settings are deliberately thin. Child widget tracking is handled at the grid-store level (via `groupId` on `WidgetInstance`), not inside the Group's own settings. This avoids duplicating instance data and keeps the grid store as the single source of truth for layout.

### Grid store changes

```ts
// Additions to src/lib/widgets/types.ts
export type WidgetInstance = {
  instanceId: string;
  widgetId: string;
  x: number; // main-grid coords, OR inner-grid coords if groupId is set
  y: number;
  w: number;
  h: number;
  settings: unknown;
  styleOverrides?: WidgetStyleOverrides;
  groupId?: string; // instanceId of the owning Group widget, if any
};
```

```ts
// Additions to src/lib/grid/store.svelte.ts

// Modified canPlace: skip children of any group when checking main-grid collisions.
// A new canPlaceInGroup(groupId, instanceId, x, y, w, h) checks collisions
// scoped to children of that specific group.

function canPlace(instanceId: string, x: number, y: number, w: number, h: number): boolean {
  // ... existing bounds + overlap logic, but skip instances where groupId is set
}

function canPlaceInGroup(
  groupId: string,
  instanceId: string,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  const group = layout.instances.find((i) => i.instanceId === groupId);
  if (!group) return false;
  const innerW = group.w - 2;
  const innerH = group.h - 2;
  if (x < 0 || y < 0 || x + w > innerW || y + h > innerH) return false;
  const target = { x, y, w, h };
  for (const other of layout.instances) {
    if (other.groupId !== groupId) continue;
    if (other.instanceId === instanceId) continue;
    if (rectsOverlap(target, other)) return false;
  }
  return true;
}

// adoptWidget: move a main-grid widget into a group, translating coordinates.
function adoptWidget(instanceId: string, groupId: string, innerX: number, innerY: number): void { ... }

// releaseWidget: move a grouped widget back to the main grid.
function releaseWidget(instanceId: string): void { ... }

// expandGroup: expand a collapsed group to the largest available height.
function expandGroup(groupId: string): void { ... }

// collapseGroup: collapse a group to 1 row.
function collapseGroup(groupId: string): void { ... }
```

## Settings form outline

| Setting                | Control       | Default | Notes                                                                |
| ---------------------- | ------------- | ------- | -------------------------------------------------------------------- |
| **Label**              | text          | `Group` | Shown in the title bar (expanded and collapsed).                     |
| **Vertical padding**   | range 0-80 px | `0`     | Padding inside the buffer zone. The 1-cell buffer is always present. |
| **Horizontal padding** | range 0-80 px | `0`     | Same as above, horizontal axis.                                      |

The settings form is intentionally minimal. The Group widget's value is structural (grouping and collapsing), not configurable. Future iterations could add: title-bar position (top/left), accent color for the group border, collapse behavior (click title bar vs button only), etc.

## Implementation notes

- **Title bar.** A horizontal bar spanning the full width of the group, occupying the top buffer row. Contains the label (left-aligned), child count badge, and a collapse/expand chevron button (right-aligned). Clicking the chevron toggles `collapsed`. The title bar is always visible, even when expanded — it sits in the buffer zone, not the inner grid.
- **Inner grid rendering.** When expanded, the Group component renders its children in a CSS Grid matching the inner dimensions. It queries `layout.instances.filter(i => i.groupId === instanceId)` and renders each one using the same `GridItem.svelte` component, but scoped to the inner coordinate space. This means `GridItem` needs to be parameterizable for its coordinate context (main grid vs group inner grid).
- **Scroll container.** The inner grid is wrapped in a `<div>` with conditional `overflow-y`. A `$derived` computes whether scrolling is needed: compare the group's current inner height (after expand) against the maximum `y + h` of all children. If any child extends beyond the visible inner area, enable scrolling.
- **Buffer zone visual.** The 1-cell border area renders with a subtle background tint (`var(--widget-group-border, hsl(var(--muted) / 0.15))`) and a thin inner border (1px solid, using `--border` token). This distinguishes the group from adjacent widgets at any zoom level and in both light and dark modes. In collapsed state, the single row uses the same tint for the title bar.
- **Expand probe.** `expandGroup()` in the grid store starts at the group's current position and its configured `expandedW`. It increments height from 1 toward `expandedH`, calling `canPlace(groupId, x, y, expandedW, candidateH)` at each step. The largest height that passes becomes the group's new `h`. If zero rows beyond the title bar are free (everything is blocked), the group stays collapsed and shows a toast ("No space to expand").
- **Coordinate translation for adopt/release.** When adopting a widget from the main grid, subtract the group's `(x + 1, y + 1)` (the inner grid's top-left corner in main-grid space) from the widget's main-grid position to get inner coordinates. When releasing, add them back. Clamp to bounds in both directions.
- **Edit mode inside groups.** When the main grid is in edit mode, expanded groups show their own edit affordances: child widgets jiggle, show remove/settings buttons, and are draggable within the inner grid. The Group's own edit controls (move, resize, remove, settings) appear on the outer border, not the inner area.
- **Removing a group.** Deleting a Group widget releases all its children back to the main grid (best-effort placement via `findFreeSlot`). If there's no room, orphaned children are queued and the user is notified.
- **Removing a child.** Deleting a widget that has a `groupId` removes it from `layout.instances` normally. No special handling needed.
- **Icons.** `lucide-svelte`: `ChevronDown`, `ChevronUp`, `Group`, `FolderOpen`, `FolderClosed`, `Ungroup`.

## Persistence and migration

The `groupId` field on `WidgetInstance` is optional. Existing layouts loaded from storage will have instances without it, which is the "not in any group" state. No migration function is needed — the field's absence is the default.

When a Group widget's settings include `collapsed: true`, the grid store must restore its collapsed size (`expandedW x 1`) on load, not the `expandedW x expandedH`. The `load()` function needs a post-load pass that adjusts group instances to their correct collapsed/expanded dimensions.

## Manifest impact

None. No permissions or network calls required.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Freshly added Group renders at default size with an empty inner grid and a title bar.
- [ ] Inner grid is exactly `(w-2) x (h-2)` cells.
- [ ] Buffer zone is always visible, even with padding set to 0.
- [ ] Drag a main-grid widget over the expanded Group; drop zone highlights.
- [ ] Drop the widget inside the Group; it adopts the widget (coordinates translate correctly).
- [ ] Drag a child widget outside the Group; it releases back to the main grid.
- [ ] Drag a child widget within the Group; inner collision detection works.
- [ ] Resize a child widget within the Group; constrained to inner grid bounds.
- [ ] Collapse the Group: height shrinks to 1 row, freed space is available to other widgets.
- [ ] Place widgets in the freed space below a collapsed Group.
- [ ] Expand the Group: expands to available height, not necessarily full configured height.
- [ ] When partially expanded, inner area scrolls vertically to reveal clipped children.
- [ ] When fully expanded, inner area does not scroll.
- [ ] Resize the Group itself: inner grid adjusts, children clipped beyond new bounds are scrollable.
- [ ] Delete the Group: all children release to the main grid.
- [ ] Delete a child inside a Group: removed cleanly, no orphan state.
- [ ] Dragging a Group widget into another Group is rejected (no nesting for v1).
- [ ] Layout persists and reloads correctly (collapsed state, child groupIds, inner positions).
- [ ] Dense mode: group and inner grid scale correctly at 2x cell counts.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Nested groups, horizontal collapse, animated expand/collapse transitions, group-level style overrides that cascade to children, multi-select drag (grab several widgets and drop them all into a group at once), group duplication (clone a group with all its children), tab-based groups (multiple "pages" of children that the user swipes between), group templates, shared groups across layouts, drag-reorder of groups relative to each other, and a group-aware "Add widget" flow that places new widgets directly into a group. v1 is: group, collapse, expand, scroll when constrained. That's it.

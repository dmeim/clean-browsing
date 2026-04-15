# To-Do / Reminder Widget (WIP)

> **Status:** ⭕ Planned
>
> **Stage:** Planning
>
> This is a design document for a widget that does **not** ship yet. Scope and settings are provisional.

## Overview

A lightweight task list for quick capture and reminders on the new-tab page. Each widget instance holds its own list, so multiple Todo widgets can act as separate buckets (Work / Personal / Shopping) without needing a category system.

v1 is deliberately small: add/edit/complete/delete tasks, optional due dates, priority colors, and one optional browser notification per due task. Projects, subtasks, and recurring tasks are all future enhancements.

## Core features

- Add task (text input) + press Enter to append.
- Complete a task via checkbox. Completed tasks strike through and optionally hide.
- Edit a task inline by clicking it.
- Delete via a trash icon on hover.
- Priority: none / low / medium / high (color-coded).
- Optional due date (date + time picker).
- Browser notification when a task becomes due (opt-in).
- Sort: manual / by due date / by priority / by creation order.
- Show/hide completed.
- Empty-state message when the list is empty.

## Open design questions

1. **Notifications permission.** Requires adding `"notifications"` to `public/manifest.json`. Permission prompt happens the first time a user creates a task with a due date + notification enabled — not on widget mount.
2. **Notification scheduling when the page isn't open.** The new-tab page only runs when the user has a new-tab page open. If Clean Browsing isn't the active new-tab, a "remind me at 3pm" task silently does nothing until the next time the page opens. This is a real limitation — the alternative is a background script (MV2 persistent page or MV3 service worker), which adds complexity and contradicts the "the extension only runs when you open the new tab" simplicity. **Recommendation: accept the limitation, document it clearly, and only fire notifications for tasks whose due time has already passed when the page loads or is currently visible.**
3. **Recurring tasks.** Nice-to-have, but they need their own generation logic and can create duplicate entries. Defer to v2.
4. **Categories vs multiple widgets.** One list per widget instance is simpler and avoids needing a category picker UI. Ship that first; revisit categories only if users ask.

## Proposed widget ID & source layout

- **Widget ID:** `todo`
- **Default size:** 6 × 6 (grid cells)
- **Source (proposed):** `src/lib/widgets/todo/`
  - `Todo.svelte`
  - `TodoSettings.svelte`
  - `definition.ts`
- **Registry wiring:** add `import "./todo/definition.js";` to `src/lib/widgets/index.ts`.

## Proposed settings type

```ts
// src/lib/widgets/todo/definition.ts
export type TodoPriority = "none" | "low" | "medium" | "high";

export type TodoItem = {
  id: string; // crypto.randomUUID()
  title: string;
  done: boolean;
  priority: TodoPriority;
  dueAt: number | null; // epoch ms
  createdAt: number;
  completedAt: number | null;
  notified: boolean; // whether we've already fired a notification for this item
};

export type TodoSort = "manual" | "due" | "priority" | "created";

export type TodoSettings = {
  items: TodoItem[];
  sortBy: TodoSort;
  showCompleted: boolean;
  defaultPriority: TodoPriority;
  notificationsEnabled: boolean; // user-facing opt-in for due-date notifications
  paddingV: number;
  paddingH: number;
};
```

`sortBy: "manual"` means the user has drag-reordered the list, so we respect the array order as-is. The other sort modes are derived at render time via `$derived` so changing the sort doesn't mutate the stored array.

## Settings form outline

| Setting                | Control                                   | Default  | Notes                                                         |
| ---------------------- | ----------------------------------------- | -------- | ------------------------------------------------------------- |
| **Default priority**   | select: none / low / medium / high        | `none`   | Applied to newly-added tasks.                                 |
| **Sort**               | select: manual / due / priority / created | `manual` |                                                               |
| **Show completed**     | toggle                                    | `on`     | Off = filter out `done: true` items from the rendered list.   |
| **Notifications**      | toggle                                    | `off`    | First toggle-on prompts via `Notification.requestPermission`. |
| **Clear completed**    | danger button                             | —        | Confirms via `AlertDialog`.                                   |
| **Vertical padding**   | range 0–80 px                             | `8`      |                                                               |
| **Horizontal padding** | range 0–80 px                             | `12`     |                                                               |

## Implementation notes

- **Inline editing.** Click a task to swap the label for an `<input>` bound to `item.title`; commit on blur or Enter. Use `$state` for which item is in edit mode.
- **Due date picker.** Use a native `<input type="datetime-local">` to avoid shipping a date library. `dayjs` is already a dep for formatting.
- **Notification check.** A `$effect` that iterates `items` on mount + on every visibility change. For each item with `dueAt <= now && !item.notified && !item.done && settings.notificationsEnabled`, fire a single `new Notification(...)` and set `notified: true`.
- **Drag reorder.** Native HTML5 drag-and-drop is enough for v1; `bits-ui` doesn't have a dedicated primitive for lists. Sets `sortBy: "manual"` automatically if the user drags.
- **Priority colors.** Map to existing CSS variables in `src/app.css` — e.g. `--accent` for high, `--muted-foreground` for low — rather than hardcoding. This keeps the widget consistent with dark/light themes via `mode-watcher`.
- **Empty state.** A small `lucide-svelte` `CheckCircle2` icon + "Nothing to do — add a task above."
- **Icons.** `lucide-svelte`: `Plus`, `Trash2`, `GripVertical`, `Bell`, `Calendar`.

## Manifest impact

Adding the Todo widget requires:

```diff
  "permissions": [
    "storage",
-   "unlimitedStorage"
+   "unlimitedStorage",
+   "notifications"
  ]
```

Flag this in the release notes when the widget ships. If the Timer widget lands first, the permission is already added and this is a no-op.

## Testing checklist (Firefox MV2)

- [ ] Widget appears in the **Add widget** dialog.
- [ ] Add / edit / complete / delete / undo paths all work.
- [ ] Tasks persist across reloads and settings edits.
- [ ] Drag reorder flips `sortBy` to `manual` and sticks.
- [ ] Sort modes (due / priority / created) render correctly without mutating stored order.
- [ ] Notifications fire once per due task; re-opening the page doesn't re-fire.
- [ ] Empty state shows when the list is empty.
- [ ] Widget scales cleanly from 6×6 to 10×10 via `widgetScaler`.
- [ ] `npm run check` passes cleanly.

## Out of scope for v1

Subtasks, projects, recurring tasks, task templates, time tracking, calendar sync, shared lists, search across widgets, analytics, voice input, smart suggestions, categories/tags. All of these are future enhancements.

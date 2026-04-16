# Notes

A markdown sticky-note for quick capture on the new tab page. Supports full GFM markdown including headings, lists, code blocks, links, blockquotes, and tables. Task-list items (`[ ]` / `[x]`) render as interactive checkboxes that toggle on a single click.

- **Widget ID:** `notes`
- **Default size:** 6 × 4 (width × height in grid cells)
- **Source:** [`src/lib/widgets/notes/`](../../src/lib/widgets/notes/)

## Permissions

None. Notes uses only `storage`, which is already present for every widget. It makes no network requests.

## Usage

1. Add **Notes** from the **Add widget** menu in edit mode.
2. **Double-click** the widget (in view mode) to open the markdown editor.
3. Type your note using standard markdown. Task lists can be written as `- [ ] item` (GFM) or plain `[ ] item` (Obsidian-style) — both work.
4. Press **Save** to apply or **Cancel** / **Escape** to discard.
5. **Single-click** any rendered checkbox to toggle it between unchecked and checked. The change persists immediately.

Task-list state is stored in the raw markdown source — toggling a checkbox rewrites `[ ]` to `[x]` (or vice versa) in the saved content.

## Settings

| Setting                | Type          | Default | What it does                                                                                        |
| ---------------------- | ------------- | ------- | --------------------------------------------------------------------------------------------------- |
| **Font family**        | select        | `sans`  | Sans-serif, serif, or monospace.                                                                    |
| **Font size**          | range 12–24   | `14`    | Base font size in pixels for the rendered markdown.                                                 |
| **Max characters**     | number        | `0`     | Soft character cap. `0` = unlimited. Shows a warning near the limit; truncates on save if exceeded. |
| **Show counter**       | toggle        | `off`   | Displays a character + word count overlay in the bottom-right corner.                               |
| **Vertical padding**   | range 0–80 px | `12`    | Space between the widget content and its top/bottom edges.                                          |
| **Horizontal padding** | range 0–80 px | `16`    | Space between the widget content and its left/right edges.                                          |
| **Export**             | button        | —       | Downloads the current note as a `.md` file.                                                         |

## Tips

- You can drop multiple Notes widgets on the grid to keep separate notes visible at the same time.
- Links in notes open in a new tab with `rel="noopener noreferrer"` for security.
- The monospace font option works well for code-heavy notes.
- The editor textarea supports standard browser spellcheck.

## Security

Rendered HTML is sanitized by DOMPurify before injection. Script tags, event handlers, and other XSS vectors are stripped. Task-list checkboxes are the only interactive elements re-enabled after sanitization.

## Out of scope (today)

Rich-text / WYSIWYG editing, multi-note tabs, markdown syntax highlighting in the editor, cloud sync, collaborative editing, and image embeds are not implemented. Keep it lean; add widgets for what you need.

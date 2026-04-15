# Picture

Displays a custom image on the grid — a portrait, a logo, a screenshot, a mood board, anything you upload. Images are stored in a shared **image library** inside `browser.storage.local`, so the same image can be reused across multiple Picture widgets without being duplicated on disk.

- **Widget ID:** `picture`
- **Default size:** 4 × 4
- **Source:** [`src/lib/widgets/picture/`](../../src/lib/widgets/picture/)

## Usage

Add the Picture widget from the **Add widget** menu in edit mode. A fresh widget is empty — open its settings and either:

1. Click **Upload new** to pick an image file from disk (max 5 MB, any standard image format — PNG, JPG, GIF, WebP, SVG).
2. Click **Pick from library** to reuse an image you've already uploaded for another Picture widget.

After an image is set, use the adjustment controls to pick how it fills the frame, where it sits, and how opaque it should be. Resizing the grid cell at any time is fine — the image stays fit to the frame.

To remove the image, open settings and click **Clear**. This only detaches it from this widget; the image stays in the library so other widgets can still reference it. To delete an image from the library entirely, use the **Image library** section of the global Settings dialog.

## Settings

| Setting         | Type                                          | Default  | What it does                                                                                                                                                                      |
| --------------- | --------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Image**       | library picker / upload                       | empty    | The image shown by the widget. Upload a new file (5 MB limit) or pick any image already in the shared library. The preview in the dialog shows the current selection.             |
| **Fit**         | `cover`, `contain`, `fill`, `none`, `scale-down` | `cover`  | How the image fills the widget frame. `cover` crops to fill, `contain` letterboxes to fit, `fill` stretches, `none` uses the image's natural size, `scale-down` shrinks if needed. |
| **Position X**  | 0–100 %                                       | `50`     | Horizontal focal point when `fit` is `cover` or `contain`. `0` = align to left edge, `100` = align to right edge.                                                                 |
| **Position Y**  | 0–100 %                                       | `50`     | Vertical focal point when `fit` is `cover` or `contain`. `0` = align to top, `100` = align to bottom.                                                                             |
| **Opacity**     | 10–100 %                                      | `100`    | Image opacity. Useful for softening a photo so other widgets sitting behind it still read clearly.                                                                                 |
| **Padding**     | 0–30 px                                       | `0`      | Inner padding between the image and the widget frame. Creates a matted-photo look without changing the widget size.                                                                |

## About the image library

- All Picture widgets share a single library stored in `browser.storage.local`. Uploading the same photo into two different widgets only stores the bytes once.
- Each library entry tracks a filename and byte size — you'll see those under the preview in the settings dialog.
- The library is also used for Clean Browsing's background-image setting, so an image uploaded as a background is also available to pick from a Picture widget, and vice versa.
- If you restore an older layout that references an image by its old inline data URL instead of a library ID, the settings dialog will show a yellow **Legacy image (not in library)** notice. The image still works; re-upload it or pick a library replacement to clean up the notice.

## Tips

- For a framed-photo look, set **Fit** to `contain` and add 10–20 px of **Padding**.
- For an abstract backdrop that fades behind other widgets, drop **Opacity** to 20–40 % and combine it with Clean Browsing's widget-background blur.
- The 5 MB upload limit exists because `browser.storage.local` is shared with the rest of your layout; very large images will eventually push you into Firefox's per-extension storage quota. Resize photos before uploading if you're hitting the limit.

# Third-Party Licenses

Clean Browsing is MIT-licensed and depends on the open-source libraries
listed below. Every dependency here is compatible with MIT and is used in
accordance with its license terms. Versions reflect what's currently
pinned in `package.json` / `package-lock.json`.

## Runtime dependencies

These ship with the production build in `dist/`.

| Library                                                                 | License               | Purpose                                                                                             |
| ----------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------- |
| [svelte](https://github.com/sveltejs/svelte)                            | MIT                   | UI framework                                                                                        |
| [bits-ui](https://github.com/huntabyte/bits-ui)                         | MIT                   | Headless UI primitives underlying shadcn-svelte                                                     |
| [shadcn-svelte](https://github.com/huntabyte/shadcn-svelte)             | MIT                   | Component templates under `src/lib/components/ui/` (source is vendored, not installed as a package) |
| [lucide-svelte](https://github.com/lucide-icons/lucide)                 | ISC                   | Icon set                                                                                            |
| [tailwindcss](https://github.com/tailwindlabs/tailwindcss)              | MIT                   | Utility-first CSS framework                                                                         |
| [tailwind-variants](https://github.com/nextui-org/tailwind-variants)    | MIT                   | Variant-based styling helper                                                                        |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge)             | MIT                   | Utility-class conflict resolution                                                                   |
| [clsx](https://github.com/lukeed/clsx)                                  | MIT                   | Conditional class string builder                                                                    |
| [dayjs](https://github.com/iamkun/dayjs)                                | MIT                   | Date formatting for widgets                                                                         |
| [marked](https://github.com/markedjs/marked)                            | MIT                   | Markdown parsing for the Notes widget                                                               |
| [dompurify](https://github.com/cure53/DOMPurify)                        | MPL-2.0 OR Apache-2.0 | Sanitizing rendered HTML from markdown / user-authored content                                      |
| [lightweight-charts](https://github.com/tradingview/lightweight-charts) | Apache-2.0            | Interactive financial charts for the Stock widget                                                   |
| [fflate](https://github.com/101arrowz/fflate)                           | MIT                   | ZIP compression for the image library export                                                        |
| [mode-watcher](https://github.com/huntabyte/mode-watcher)               | MIT                   | Light/dark mode toggle utilities                                                                    |
| [svelte-sonner](https://github.com/wobsoriano/svelte-sonner)            | MIT                   | Toast notifications                                                                                 |

## Dev dependencies

These are used for development, builds, and packaging. None ship to users.

| Library                                                                        | License    | Purpose                                            |
| ------------------------------------------------------------------------------ | ---------- | -------------------------------------------------- |
| [vite](https://github.com/vitejs/vite)                                         | MIT        | Bundler / dev server                               |
| [@sveltejs/vite-plugin-svelte](https://github.com/sveltejs/vite-plugin-svelte) | MIT        | Svelte integration for Vite                        |
| [@tailwindcss/vite](https://github.com/tailwindlabs/tailwindcss)               | MIT        | Tailwind v4 Vite plugin                            |
| [typescript](https://github.com/microsoft/TypeScript)                          | Apache-2.0 | Type checker                                       |
| [svelte-check](https://github.com/sveltejs/language-tools)                     | MIT        | Svelte + TS diagnostics                            |
| [web-ext](https://github.com/mozilla/web-ext)                                  | MPL-2.0    | Firefox extension packaging, run, and signing      |
| [concurrently](https://github.com/open-cli-tools/concurrently)                 | MIT        | Runs Vite watcher + web-ext in parallel during dev |
| [@types/node](https://github.com/DefinitelyTyped/DefinitelyTyped)              | MIT        | Node type definitions                              |

## License compatibility

All of the above licenses (MIT, ISC, Apache-2.0, MPL-2.0) are compatible
with Clean Browsing's own [MIT License](../LICENSE) for redistribution as a
Firefox extension. MPL-2.0 dependencies (web-ext) are dev-only and do not
ship in the packaged extension.

## Where the actual license texts live

Each dependency's license text ships inside its own `package/LICENSE` file
under `node_modules/<dependency>/`. The authoritative copies are in the
upstream repositories linked in the table above.

---

_Last updated for Clean Browsing v1.6.2._

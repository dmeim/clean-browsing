// Inline Lucide icon paths (ISC license, Lucide Contributors). Kept local
// per-widget so we don't depend on lucide-svelte (which currently ships in
// a Svelte 4 form incompatible with this project's runes-mode build).

type IconAttrs = Record<string, string>;
type IconNode = [string, IconAttrs];

export const ICON_NODES = {
  "trending-up": [
    ["polyline", { points: "22 7 13.5 15.5 8.5 10.5 2 17" }],
    ["polyline", { points: "16 7 22 7 22 13" }],
  ],
  "trending-down": [
    ["polyline", { points: "22 17 13.5 8.5 8.5 13.5 2 7" }],
    ["polyline", { points: "16 17 22 17 22 11" }],
  ],
  minus: [["path", { d: "M5 12h14" }]],
  "rotate-cw": [
    ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }],
  ],
  search: [
    ["circle", { cx: "11", cy: "11", r: "8" }],
    ["path", { d: "m21 21-4.3-4.3" }],
  ],
  "circle-alert": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }],
  ],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }],
  ],
  clock: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["polyline", { points: "12 6 12 12 16 14" }],
  ],
  "chart-line": [
    ["path", { d: "M3 3v18h18" }],
    ["path", { d: "m19 9-5 5-4-4-3 3" }],
  ],
} satisfies Record<string, IconNode[]>;

export type IconName = keyof typeof ICON_NODES;

type IconAttrs = Record<string, string>;
type IconNode = [string, IconAttrs];

export const ICON_NODES = {
  "chart-line": [
    ["path", { d: "M3 3v18h18" }],
    ["path", { d: "m19 9-5 5-4-4-3 3" }],
  ],
  "rotate-cw": [
    ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }],
  ],
  "circle-alert": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }],
  ],
  clock: [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["polyline", { points: "12 6 12 12 16 14" }],
  ],
  plus: [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M12 5v14" }],
  ],
  "trash-2": [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }],
  ],
  "grip-vertical": [
    ["circle", { cx: "9", cy: "12", r: "1", fill: "currentColor" }],
    ["circle", { cx: "9", cy: "5", r: "1", fill: "currentColor" }],
    ["circle", { cx: "9", cy: "19", r: "1", fill: "currentColor" }],
    ["circle", { cx: "15", cy: "12", r: "1", fill: "currentColor" }],
    ["circle", { cx: "15", cy: "5", r: "1", fill: "currentColor" }],
    ["circle", { cx: "15", cy: "19", r: "1", fill: "currentColor" }],
  ],
} satisfies Record<string, IconNode[]>;

export type IconName = keyof typeof ICON_NODES;

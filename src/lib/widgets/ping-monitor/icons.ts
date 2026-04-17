type IconAttrs = Record<string, string>;
type IconNode = [string, IconAttrs];

export const ICON_NODES: Record<string, IconNode[]> = {
  wifi: [
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 20 0" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 14 0" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }],
  ],
  "wifi-off": [
    ["path", { d: "M12 20h.01" }],
    ["path", { d: "M8.5 16.429a5 5 0 0 1 7 0" }],
    ["path", { d: "M5 12.859a10 10 0 0 1 5.17-2.69" }],
    ["path", { d: "M13.41 10.25a10 10 0 0 1 5.59 2.61" }],
    ["path", { d: "M2 8.82a15 15 0 0 1 4.17-2.65" }],
    ["path", { d: "M10.66 6.34A15 15 0 0 1 22 8.82" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }],
  ],
  "rotate-cw": [
    ["path", { d: "M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" }],
    ["path", { d: "M21 3v5h-5" }],
  ],
  bell: [
    ["path", { d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" }],
    ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }],
  ],
  "bell-off": [
    ["path", { d: "M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5" }],
    ["path", { d: "M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7" }],
    ["path", { d: "M10.3 21a1.94 1.94 0 0 0 3.4 0" }],
    ["line", { x1: "2", x2: "22", y1: "2", y2: "22" }],
  ],
  "circle-alert": [
    ["circle", { cx: "12", cy: "12", r: "10" }],
    ["line", { x1: "12", x2: "12", y1: "8", y2: "12" }],
    ["line", { x1: "12", x2: "12.01", y1: "16", y2: "16" }],
  ],
  "trash-2": [
    ["path", { d: "M3 6h18" }],
    ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }],
    ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }],
    ["line", { x1: "10", x2: "10", y1: "11", y2: "17" }],
    ["line", { x1: "14", x2: "14", y1: "11", y2: "17" }],
  ],
  plus: [
    ["path", { d: "M5 12h14" }],
    ["path", { d: "M12 5v14" }],
  ],
  x: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "m6 6 12 12" }],
  ],
};

export type IconName = keyof typeof ICON_NODES;

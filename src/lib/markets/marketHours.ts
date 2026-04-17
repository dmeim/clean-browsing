// US NYSE / NASDAQ market hours awareness. Pure clock check — does not
// account for federal holidays (Thanksgiving, Christmas, etc.). On those
// days the widget will still attempt a fetch and Yahoo will return last-
// close data, which is the correct rendering anyway.

import type { MarketState } from "./types.js";

const NYSE_OPEN_MINUTES = 9 * 60 + 30; // 09:30 ET
const NYSE_CLOSE_MINUTES = 16 * 60; // 16:00 ET

type EasternParts = {
  weekday: string;
  hour: number;
  minute: number;
};

function easternParts(now: Date): EasternParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  // hour can come back as "24" at midnight in some runtimes — normalize.
  const hourRaw = parseInt(map.hour ?? "0", 10);
  return {
    weekday: map.weekday ?? "",
    hour: hourRaw === 24 ? 0 : hourRaw,
    minute: parseInt(map.minute ?? "0", 10),
  };
}

export function isUSEquityMarketOpen(now: Date = new Date()): boolean {
  const { weekday, hour, minute } = easternParts(now);
  if (weekday === "Sat" || weekday === "Sun") return false;
  const cur = hour * 60 + minute;
  return cur >= NYSE_OPEN_MINUTES && cur < NYSE_CLOSE_MINUTES;
}

export function usEquityMarketState(now: Date = new Date()): MarketState {
  return isUSEquityMarketOpen(now) ? "open" : "closed";
}

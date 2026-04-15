/**
 * Typed wrappers around the subset of `browser.alarms` +
 * `browser.notifications` we use for the Timer widget.
 *
 * The background script in `public/background.js` listens for alarms
 * whose name starts with `timer:` and fires a notification encoded in
 * the alarm name. Encoding everything into the name means the background
 * script stays stateless — no message passing, no storage reads.
 *
 * Alarm name format (colon-separated, with base64url-encoded fields so
 * labels can contain arbitrary characters):
 *
 *   timer:<instanceId>:<b64url label>:<sound>
 */

type AlarmInfo = { name: string; scheduledTime: number };

type BrowserLike = {
  alarms?: {
    create: (name: string, info: { when: number }) => void;
    clear: (name: string) => Promise<boolean>;
    get: (name: string) => Promise<AlarmInfo | undefined>;
  };
  notifications?: {
    create: (options: {
      type: "basic";
      title: string;
      message: string;
      iconUrl?: string;
    }) => Promise<string>;
  };
};

declare const browser: BrowserLike | undefined;

export function hasAlarmsApi(): boolean {
  return typeof browser !== "undefined" && !!browser?.alarms?.create;
}

export function hasNotificationsApi(): boolean {
  return typeof browser !== "undefined" && !!browser?.notifications?.create;
}

function b64urlEncode(input: string): string {
  // btoa only accepts latin1; round-trip through UTF-8 bytes so labels
  // with emoji or non-ASCII text survive intact.
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildAlarmName(instanceId: string, label: string, sound: "none" | "beep"): string {
  return `timer:${instanceId}:${b64urlEncode(label)}:${sound}`;
}

export function isTimerAlarmName(name: string): boolean {
  return name.startsWith("timer:");
}

export async function scheduleTimerAlarm(
  instanceId: string,
  label: string,
  sound: "none" | "beep",
  fireAtEpoch: number,
): Promise<void> {
  if (!hasAlarmsApi()) return;
  const name = buildAlarmName(instanceId, label, sound);
  browser!.alarms!.create(name, { when: fireAtEpoch });
}

export async function clearAlarmByName(name: string): Promise<void> {
  if (!hasAlarmsApi()) return;
  try {
    await browser!.alarms!.clear(name);
  } catch {
    // ignore — alarm may already have fired or never existed
  }
}

export async function alarmExists(name: string): Promise<boolean> {
  if (!hasAlarmsApi()) return false;
  try {
    const got = await browser!.alarms!.get(name);
    return !!got;
  } catch {
    return false;
  }
}

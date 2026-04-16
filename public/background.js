/*
 * Clean Browsing — non-persistent event page.
 *
 * The only job of this script is to turn Timer-widget alarms into
 * notifications. It is completely stateless: the alarm name encodes the
 * widget instance ID, a base64url-encoded label, and the sound setting.
 * The new-tab page schedules the alarm via browser.alarms.create(), and
 * when Firefox fires onAlarm this handler decodes the name and calls
 * browser.notifications.create().
 *
 * Name format:
 *   timer:<instanceId>:<b64url label>:<sound>
 */

function b64urlDecode(encoded) {
  try {
    const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
    const binary = atob(padded + pad);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

browser.alarms.onAlarm.addListener((alarm) => {
  const name = alarm && alarm.name;
  if (typeof name !== "string" || !name.startsWith("timer:")) return;

  const parts = name.split(":");
  // parts = ["timer", instanceId, b64urlLabel, sound]
  const label = parts.length >= 3 ? b64urlDecode(parts[2]) : "Timer";

  browser.notifications
    .create({
      type: "basic",
      title: label || "Timer",
      message: "Time's up",
      iconUrl: "branding/logo-png-transparent/logo-color-transparent.png",
    })
    .catch(() => {
      // notifications may be blocked at the OS level — nothing we can do
    });
});

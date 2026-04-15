/**
 * Synthesized beep used for timer expiry when the widget is foreground.
 * For background expiry (tab closed), the browser's own notification
 * sound fires via the `Notification` API in the background script.
 * Lazy AudioContext creation — eager instantiation throws in Firefox.
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (ctx) return ctx;
  const AC =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  if (!AC) return null;
  try {
    ctx = new AC();
  } catch {
    ctx = null;
  }
  return ctx;
}

export function playBeep(): void {
  const ac = getContext();
  if (!ac) return;
  const now = ac.currentTime;
  // Three short chirps at 880Hz, spaced ~0.18s apart.
  for (let i = 0; i < 3; i++) {
    const start = now + i * 0.18;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    osc.connect(gain).connect(ac.destination);
    osc.start(start);
    osc.stop(start + 0.16);
  }
}

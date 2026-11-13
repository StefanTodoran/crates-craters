import * as Haptics from "expo-haptics";
import { SoundEvent } from "./logic";

// Module-level so gesture handlers (created once) can call these without context.
let enabled = true;

/** Mirrors the haptics setting; App keeps this in sync. */
export function setHapticsEnabled(value: boolean) {
  enabled = value;
}

const ignore = () => { }; // Haptics are best-effort; unsupported devices just reject.

function impact(style: Haptics.ImpactFeedbackStyle) {
  if (enabled) Haptics.impactAsync(style).catch(ignore);
}

function notify(type: Haptics.NotificationFeedbackType) {
  if (enabled) Haptics.notificationAsync(type).catch(ignore);
}

/** A light tick, e.g. for each tile painted in the editor. */
export function hapticSelection() {
  if (enabled) Haptics.selectionAsync().catch(ignore);
}

export function hapticErase() {
  impact(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticWin() {
  notify(Haptics.NotificationFeedbackType.Success);
}

/** Feedback for a game move, by the sound event it produced. */
export function hapticForEvent(event: SoundEvent | undefined) {
  switch (event) {
    case SoundEvent.MOVE:
      impact(Haptics.ImpactFeedbackStyle.Soft);
      break;
    case SoundEvent.PUSH:
    case SoundEvent.ICE:
      impact(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case SoundEvent.FILL:
    case SoundEvent.DOOR:
      impact(Haptics.ImpactFeedbackStyle.Rigid);
      break;
    case SoundEvent.EXPLOSION:
      impact(Haptics.ImpactFeedbackStyle.Heavy);
      break;
    case SoundEvent.COLLECT:
      impact(Haptics.ImpactFeedbackStyle.Light);
      break;
  }
}

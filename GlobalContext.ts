import { UserCredential } from "firebase/auth";
import { createContext } from "react";
import { UserAccountDocument } from "./util/database";

/**
 * @param {boolean} darkMode
 * A true/false value representing whether the app is in dark mode. Should be used for modal backgrounds,
 * text colors, etc.
 * 
 * @param {number} dragSensitivity
 * A number between 0 and 2 representing the sensitivity of drag motions when playing the game.
 * 
 * @param {number} doubleTapDelay
 * A number representing how many miliseconds delay of tolerance are allowed between two taps for it to
 * count as a double tap.
 * 
 * @param {number} playAudio
 * A boolean representing whether the app should play sound effects or not.
 */
interface GlobalContext {
  darkMode: boolean,
  dragSensitivity: number,
  doubleTapDelay: number,
  playAudio: boolean,
  userCredential?: UserCredential,
  userData?: UserAccountDocument,
}

export const defaultSettings = {
  darkMode: false,
  dragSensitivity: 60,
  doubleTapDelay: 250,
  playAudio: true,
}

const GC = createContext<GlobalContext>({ ...defaultSettings });
export default GC;
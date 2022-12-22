import { createContext } from "react";
export const GlobalContext = createContext({});

/**
 * GlobalContext
 * 
 * @param {boolean} darkMode
 * A true/false value representing whether the app is in dark mode. Should be used for modal backgrounds,
 * text colors, etc.
 * 
 * @param {number} dragSensitivity
 * A number between 0 and 2 representing the sensitivity of drag motions when playing the game.
 * 
 */
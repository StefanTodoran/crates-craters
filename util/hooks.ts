import { AudioPlayer, useAudioPlayer } from "expo-audio";
import { useContext, useEffect, useRef, useState } from "react";
import { useMMKVBoolean, useMMKVNumber } from "react-native-mmkv";
import GlobalContext, { defaultSettings } from "../GlobalContext";
import { SoundEvent } from "./logic";

export function useOnUnmount(callback: () => void, dependencies: React.DependencyList) {
  const unmounting = useRef(false);

  useEffect(() => {
    return () => {
      // This occurs when the component is unmounting.
      unmounting.current = true;
    }
  }, []);

  useEffect(() => {
    return () => {
      // This occurs after before any state change involving
      // one of the dependencies, including unmounting.
      if (unmounting.current) callback();
    }
  }, dependencies);
}

type BooleanSetting = [boolean, React.Dispatch<React.SetStateAction<boolean>>]; /* [value, setter] */

export function useBooleanSetting(settingName: string): BooleanSetting {
  const [storedValue, setStored] = useMMKVBoolean(settingName);
  // @ts-expect-error We will assume that the settingName key is correct.
  const defaultValue = defaultSettings[settingName];

  const [stateValue, setState] = useState<boolean>(storedValue || defaultValue);
  useEffect(() => setStored(stateValue), [stateValue]);

  return [stateValue, setState];
}

type NumberSetting = [number, (newValue: number) => void]; /* [value, setter] */

export function useNumberSetting(settingName: string): NumberSetting {
  const [storedValue, setValue] = useMMKVNumber(settingName);
  // @ts-expect-error We will assume that the settingName key is correct.
  const defaultValue = defaultSettings[settingName];
  return [storedValue || defaultValue, setValue];
}

/**
 * @param {boolean} refreshed 
 * The actual boolean value does not represent whether the component has 
 * refreshed, but it can be used as a dependency in other hooks in order to
 * cause them to rerun.
 * 
 * @param {() => void} forceRefresh
 * Function used to force the component to refresh, which toggles the value
 * of "refreshed".
 */
type ForceRefresh = [boolean, () => void];

export function useForceRefresh(): ForceRefresh {
  const [stateValue, setState] = useState<boolean>(false);
  return [stateValue, () => setState(cur => !cur)];
}

export function useProfiler(rounds: number) {
  const renderTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  startTime.current = new Date().getTime();

  useEffect(() => {
    const endTime = new Date().getTime();
    renderTimes.current.push(endTime - startTime.current);

    if (renderTimes.current.length === rounds) {
      const average = renderTimes.current.reduce((a, b) => a + b) / renderTimes.current.length
      console.log(`Average render time over ${rounds} renders was ${average}ms`);
      renderTimes.current = [];
    }
  });
}

type Timer = ReturnType<typeof setTimeout>;
type AnyFunc = (...args: any[]) => void;

/**
 *
 * @param func The original, non debounced function (can accept any number of args)
 * @param delay The delay (in ms) for the function to return
 * @returns The debounced function, which will run only if the debounced function has not been called in the last (delay) ms
 */
export function useDebounce<Func extends AnyFunc>(
  func: Func,
  delay = 1000
) {
  const timer = useRef<Timer>(undefined);

  useEffect(() => {
    return () => {
      if (!timer.current) return;
      clearTimeout(timer.current);
    };
  }, []);

  const debouncedFunction = ((...args) => {
    const newTimer = setTimeout(() => {
      func(...args);
    }, delay);
    clearTimeout(timer.current);
    timer.current = newTimer;
  }) as Func;

  return debouncedFunction;
}

const moveSound = require("../assets/audio/move.wav");
const pushSound = require("../assets/audio/push.wav");
const fillSound = require("../assets/audio/fill.wav");
const coinSound = require("../assets/audio/coin.wav");
const doorSound = require("../assets/audio/door.wav");
const explosionSound = require("../assets/audio/explosion.wav");

export function useSoundEventPlayers() {
  const { playAudio } = useContext(GlobalContext);

  const moveSoundPlayer = useAudioPlayer(moveSound);
  const pushSoundPlayer = useAudioPlayer(pushSound);
  const fillSoundPlayer = useAudioPlayer(fillSound);
  const coinSoundPlayer = useAudioPlayer(coinSound);
  const doorSoundPlayer = useAudioPlayer(doorSound);
  const explosionSoundPlayer = useAudioPlayer(explosionSound);

  function playSound(soundPlayer: AudioPlayer) {
    soundPlayer.play();
    soundPlayer.seekTo(0);
  }

  function playSoundEvent(soundEffect: SoundEvent | undefined) {
    if (!playAudio) return;
    switch (soundEffect) {
      case SoundEvent.EXPLOSION:
        playSound(explosionSoundPlayer);
        break;
      case SoundEvent.PUSH:
        playSound(pushSoundPlayer);
        break;
      case SoundEvent.FILL:
        playSound(fillSoundPlayer);
        break;
      case SoundEvent.DOOR:
        playSound(doorSoundPlayer);
        break;
      case SoundEvent.COLLECT:
        playSound(coinSoundPlayer);
        break;
      case SoundEvent.MOVE:
        playSound(moveSoundPlayer);
        break;
    }
  }

  return playSoundEvent;
} 
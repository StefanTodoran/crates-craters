import { AudioPlayer, useAudioPlayer } from "expo-audio";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useMMKVBoolean, useMMKVNumber } from "react-native-mmkv";
import GlobalContext, { defaultSettings } from "../GlobalContext";
import { useAppStore } from "./store";
import { SoundEvent } from "./logic";

/**
 * Tracks a board view's position on screen, for mapping touches to tiles.
 * Measures on layout, again shortly after the page panel finishes its open animation
 * (a measurement taken mid-slide is offset by the panel's translation), and whenever
 * remeasure() is called.
 */
export function useBoardPosition() {
  const boardRef = useRef<View>(null);
  const boardPosition = useRef({ x: 0, y: 0 });

  const remeasure = useCallback(() => {
    boardRef.current?.measure((_x, _y, _width, _height, pageX, pageY) => {
      if (pageX === undefined || pageY === undefined) return;
      boardPosition.current = { x: pageX, y: pageY };
    });
  }, []);

  const pageOpenedCount = useAppStore(state => state.pageOpenedCount);
  useEffect(() => {
    // measure() doesn't see native-driven transforms until their final value is synced
    // back after the animation ends, so wait briefly before re-measuring.
    const timers = [setTimeout(remeasure, 100), setTimeout(remeasure, 500)];
    return () => timers.forEach(clearTimeout);
  }, [pageOpenedCount, remeasure]);

  return { boardRef, boardPosition, remeasure };
}

/**
 * An in-page modal that fades in and out. The modal stays mounted (modalOpen) until
 * its fade out finishes.
 */
export function useFadeModal(duration: number) {
  const [modalOpen, setModalOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const isOpen = useRef(false); // Flips immediately, while modalOpen waits for the fade out.

  const toggleModal = useCallback(() => {
    isOpen.current = !isOpen.current;
    if (isOpen.current) {
      setModalOpen(true);
      Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }).start();
    } else {
      // Reopening mid-fade interrupts this animation, so the modal stays mounted.
      Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setModalOpen(false);
      });
    }
  }, [duration]);

  return { modalOpen, anim, toggleModal };
}

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

type Settings = typeof defaultSettings;
type SettingName<T> = { [K in keyof Settings]: Settings[K] extends T ? K : never }[keyof Settings];
type BooleanSetting = [boolean, React.Dispatch<React.SetStateAction<boolean>>]; /* [value, setter] */

export function useBooleanSetting(settingName: SettingName<boolean>): BooleanSetting {
  const [storedValue, setStored] = useMMKVBoolean(settingName);
  const defaultValue = defaultSettings[settingName];

  const [stateValue, setState] = useState<boolean>(storedValue ?? defaultValue);
  useEffect(() => setStored(stateValue), [stateValue]);

  return [stateValue, setState];
}

type NumberSetting = [number, (newValue: number) => void]; /* [value, setter] */

export function useNumberSetting(settingName: SettingName<number>): NumberSetting {
  const [storedValue, setValue] = useMMKVNumber(settingName);
  const defaultValue = defaultSettings[settingName];
  return [storedValue ?? defaultValue, setValue];
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
const iceSound = require("../assets/audio/ice.wav");

export function useSoundEventPlayers() {
  const { playAudio } = useContext(GlobalContext);

  const moveSoundPlayer = useAudioPlayer(moveSound);
  const pushSoundPlayer = useAudioPlayer(pushSound);
  const fillSoundPlayer = useAudioPlayer(fillSound);
  const coinSoundPlayer = useAudioPlayer(coinSound);
  const doorSoundPlayer = useAudioPlayer(doorSound);
  const explosionSoundPlayer = useAudioPlayer(explosionSound);
  const iceSoundPlayer = useAudioPlayer(iceSound);

  function playSound(soundPlayer: AudioPlayer) {
    // Rewind first: once a sound has finished, play() alone starts at the end and
    // is silent, so playing then rewinding made every other move silent.
    soundPlayer.seekTo(0);
    soundPlayer.play();
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
      case SoundEvent.ICE:
        playSound(iceSoundPlayer);
        break;
    }
  }

  return playSoundEvent;
} 
/**
 * A 0→1 clock that repeats every `duration` ms, for looping tile animations. Its phase
 * comes from the wall clock, so every tile's clock agrees (staggering is done with
 * explicit offsets) and a restart never visibly jumps. Each cycle is its own timing, so
 * the loop also restarts itself if React Native stops it: an Animated value stops its
 * animation whenever its last attached view detaches, e.g. when an animated component
 * re-renders with new props.
 */
export function useLoopClock(duration: number, useNativeDriver: boolean) {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let active = true;
    let frame: number | undefined;

    const run = () => {
      if (!active) return;
      const start = (Date.now() % duration) / duration;
      value.setValue(start);
      Animated.timing(value, {
        toValue: 1,
        duration: duration * (1 - start),
        easing: Easing.linear,
        useNativeDriver,
        isInteraction: false,
      }).start(() => {
        if (active) frame = requestAnimationFrame(run);
      });
    };
    run();

    return () => {
      active = false;
      if (frame !== undefined) cancelAnimationFrame(frame);
      value.stopAnimation();
    };
  }, [value, duration, useNativeDriver]);

  return value;
}

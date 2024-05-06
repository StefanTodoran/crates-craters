import { useRef, useEffect, useState } from "react";
import { useMMKVBoolean, useMMKVNumber } from "react-native-mmkv";
import { defaultSettings } from "../GlobalContext";

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
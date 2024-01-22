import React, { useRef, useEffect, useState } from "react";
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
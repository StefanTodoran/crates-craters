import React, { useRef, useEffect } from "react";

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
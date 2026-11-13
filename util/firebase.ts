import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";
// import { getStorage } from "firebase/storage";
// getReactNativePersistence is only exported by the react-native build of firebase/auth,
// which Metro resolves; tsconfig maps @firebase/auth to that build's type declarations.
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { MMKV } from "react-native-mmkv";

const firebaseConfig = {
  apiKey: "AIzaSyASxDTiQ2ahy8fhVtllCnQ4Lbh2bhqsr9A",
  authDomain: "crates-n-craters.firebaseapp.com",
  projectId: "crates-n-craters",
  storageBucket: "crates-n-craters.appspot.com",
  messagingSenderId: "967442204309",
  appId: "1:967442204309:web:062c693d6beac71d4cbd9c"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
// export const storage = getStorage(app);
// export const analytics = getAnalytics(app);
// Firebase Auth keeps its own session (a refresh token, never the password) in a
// dedicated MMKV instance, so users stay signed in across launches.
const authStorage = new MMKV({ id: "firebase-auth" });
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence({
    getItem: (key: string) => Promise.resolve(authStorage.getString(key) ?? null),
    setItem: (key: string, value: string) => Promise.resolve(authStorage.set(key, value)),
    removeItem: (key: string) => Promise.resolve(authStorage.delete(key)),
  }),
});

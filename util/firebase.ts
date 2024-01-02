import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// import { getAnalytics } from "firebase/analytics";
// import { getStorage } from "firebase/storage";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

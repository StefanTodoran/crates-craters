import { initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { collection, DocumentData, getDocs, getFirestore, QuerySnapshot } from "firebase/firestore";

import serviceAccount from "./serviceAccountKey.json";
export const admin = require("firebase-admin");
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

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
export const auth = initializeAuth(app);

export async function getAllEntries(collectionName: string) {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return parseQuerySnapshot(querySnapshot);
}

function parseQuerySnapshot(snapshot: QuerySnapshot<DocumentData, DocumentData>) {
    const docs: any[] = [];
    snapshot.forEach((doc) => {
        // doc.data() is never undefined for query doc snapshots
        const next = doc.data();
        next.id = doc.id;
        next.uuid = doc.id;
        docs.push(next);
    });

    return docs;
}
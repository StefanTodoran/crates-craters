import {
  DocumentData,
  DocumentReference,
  QuerySnapshot,
  Timestamp,
  addDoc,
  collection,
  doc,
  documentId,
  getCountFromServer,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "./firebase";

import { getData, getStoredLevelCount, metadataKeys, multiStoreLevels, parseCompressedBoardData, setData } from "./loader";
import { OfficialLevel } from "./types";
import { doStateStorageSync } from "./events";

// ======================== \\
// DOCUMENT TYPE INTERFACES \\

interface MetadataDocument {
  officialLevelsUpdated: Timestamp,
}

export interface OfficialLevelDocument {
  id: string,
  name: string,
  board: string,
  order: number,
}

export interface UserLevelDocument {
  id: string,
  name: string,
  board: string,
  designer: string,
  shared: Timestamp,
  downloads: number,
}

// ==================== \\
// HIGH LEVEL FUNCTIONS \\

export async function checkForOfficialLevelUpdates(): Promise<number> {
  const metadata: MetadataDocument = await getSpecificEntry("metadata", "metadata");
  const updated: Timestamp = getData(metadataKeys.lastUpdatedOfficialLevels);
  const prevCount = getStoredLevelCount();

  if (!updated || !metadata || updated.seconds !== metadata.officialLevelsUpdated.seconds || prevCount === 0) {
    const levels = await fetchOfficialLevelsFromServer();
    if (levels.length === 0) return 0; // For some reason firestore getDocs returns an empty snapshot instead of failing when offline.

    multiStoreLevels(levels);
    setData(metadataKeys.lastUpdatedOfficialLevels, metadata.officialLevelsUpdated);

    return levels.length - prevCount;
  }
  return 0;
}

export async function refreshLevelsFromServer(): Promise<boolean> {
  const levels = await fetchOfficialLevelsFromServer();
  if (levels.length === 0) return false; // For some reason firestore getDocs returns an empty snapshot instead of failing when offline.

  multiStoreLevels(levels);
  doStateStorageSync();
  return true;
}

async function fetchOfficialLevelsFromServer() {
  const rawLevels: OfficialLevelDocument[] = await getAllEntries("officialLevels");
  const parsedLevels: OfficialLevel[] = [];

  for (let i = 0; i < rawLevels.length; i++) {
    const rawLevel = rawLevels[i];
    const existingLevel: OfficialLevel = getData(rawLevel.id);
    
    const updatedLevel: OfficialLevel = {
      uuid: rawLevel.id,
      name: rawLevel.name,
      board: parseCompressedBoardData(rawLevel.board),
      completed: existingLevel?.completed,
      official: true,
      order: rawLevel.order,
    };

    parsedLevels.push(updatedLevel);
  }

  return parsedLevels;
}

// ========================== \\
// COLLECTION QUERY FUNCTIONS \\

export async function doesEntryExist(collectionName: string, docName: string): Promise<boolean> {
  const q = query(collection(db, collectionName), where(documentId(), '==', docName)); // TODO: evaluate difference between documentId() and "__name__"
  const snap = await getCountFromServer(q)
  return !!snap.data().count;
}

export async function getEntryCount(collectionName: string): Promise<number> {
  const q = query(collection(db, collectionName));
  const snap = await getCountFromServer(q)
  return snap.data().count;
}

export async function getAllEntries(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return parseQuerySnapshot(querySnapshot);
}

export async function getSpecificEntry(collectionName: string, docName: string) {
  const q = query(collection(db, collectionName), where("__name__", "==", docName));
  const querySnapshot = await getDocs(q);
  const docs = parseQuerySnapshot(querySnapshot);

  if (docs.length === 0) {
    throw new Error(`No document "${docName}" found in collection "${collectionName}"`);
  }
  else if (docs.length === 1) return docs[0]; // Success case
  else {
    console.warn(`Found multiple records for "${docName}" in "${collectionName}"!`);
    console.warn(`Using first document returned by query snapshot.`);
    return docs[0];
  }
}

// ======================= \\
// DOCUMENT CRUD FUNCTIONS \\

export async function createDocument(
  collectionName: string,
  docName: string | undefined,
  docContent: any,
): Promise<DocumentReference | null> {
  let newDoc;

  try {
    if (docName) {
      newDoc = doc(db, collectionName, docName);
      await setDoc(newDoc, docContent);
    } else {
      // If no document name provided, use auto generated firestore document id
      newDoc = await addDoc(collection(db, collectionName), docContent);
    }
  } catch (error) {
    console.error("Error creating document:", error);
    return null;
  }

  return newDoc;
}

export async function updateDocument(
  collectionName: string,
  docName: string,
  updateContent: any,
): Promise<boolean> {
  const documentRef = doc(db, collectionName, docName);

  try {
    await updateDoc(documentRef, updateContent);
    return true;
  } catch (error) {
    console.error("Error updating document:", error);
    return false;
  }
}

// ================ \\
// HELPER FUNCTIONS \\

function parseQuerySnapshot(snapshot: QuerySnapshot<DocumentData, DocumentData>) {
  const docs: any[] = [];
  snapshot.forEach((doc) => {
    // doc.data() is never undefined for query doc snapshots
    const next = doc.data();
    next.id = doc.id;
    docs.push(next);
  });

  return docs;
}
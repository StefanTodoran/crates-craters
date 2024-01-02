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

import { getData, metadataKeys, multiStoreLevels, parseCompressedBoardData, setData } from "./loader";
import { OfficialLevel } from "./types";

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
  user: string,
  created: Timestamp,
  likes: number,
  downloads: number,
}

// ==================== \\
// HIGH LEVEL FUNCTIONS \\

export async function checkForOfficialLevelUpdates() {
  console.log("Checking for updates...");
  const metadata: MetadataDocument = await getSpecificEntry("metadata", "metadata");
  const updated: Timestamp = await getData(metadataKeys.lastUpdatedOfficialLevels);
  
  if (!updated || !metadata || updated.seconds !== metadata.officialLevelsUpdated.seconds) {
    console.log("Official level updates found!");
    const levels = await getOfficialLevels();
    multiStoreLevels(levels);
    setData(metadataKeys.lastUpdatedOfficialLevels, metadata.officialLevelsUpdated);
  }
}

export async function getOfficialLevels() {
  const rawLevels: OfficialLevelDocument[] = await getAllEntries("officialLevels");
  const parsedLevels: OfficialLevel[] = [];

  for (let i = 0; i < rawLevels.length; i++) {
    const rawLevel = rawLevels[i];
    const existingLevel: OfficialLevel = await getData(rawLevel.id);
    
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
import { DocumentData, DocumentReference, Query, QuerySnapshot, Timestamp, WhereFilterOp, addDoc, collection, doc, getCountFromServer, getDocs, limit, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import { getData, getStoredLevelCount, metadataKeys, multiStoreLevels, parseCompressedBoardData, setData } from "./loader";

import { db } from "./firebase";
import { Direction, OfficialLevel } from "./types";
import { doStateStorageSync } from "./events";

import { setLogLevel } from "firebase/firestore";
setLogLevel("debug");

// ======================== \\
// DOCUMENT TYPE INTERFACES \\

interface MetadataDocument {
  officialLevelsUpdated: Timestamp,
}

export interface OfficialLevelDocument {
  uuid: string,
  name: string,
  board: string,
  order: number,
}

export interface UserLevelDocument {
  uuid: string,
  name: string,
  board: string,
  designer: string,
  user_id: string,
  shared: Timestamp,
  attempts: number,
  wins: number,
  winrate: number,
  likes: number,
  best: number,
  keywords: string[], // Space-seperated contents of name and designer
}

export interface UserAccountDocument {
  uuid: string, // Referred to as user_id in documents in other collections.
  username: string,
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

    console.log(">>> levels", levels);
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
    const existingLevel: OfficialLevel = getData(rawLevel.uuid);

    const updatedLevel: OfficialLevel = {
      uuid: rawLevel.uuid,
      name: rawLevel.name,
      board: parseCompressedBoardData(rawLevel.board),
      completed: existingLevel?.completed,
      best: existingLevel?.best,
      official: true,
      order: rawLevel.order,
    };

    parsedLevels.push(updatedLevel);
  }

  return parsedLevels;
}

export async function likeUserLevel(uuid: string) {
  const likedLevels = getData(metadataKeys.likedLevels) || [];
  if (likedLevels.includes(uuid)) return false;

  const updatedData = await getSpecificEntry("userLevels", uuid) as UserLevelDocument;
  const success = await updateDocument("userLevels", uuid, { likes: updatedData.likes + 1 });

  if (success) {
    likedLevels.push(uuid);
    setData(metadataKeys.likedLevels, likedLevels);
  }

  return success;
}

export async function attemptUserLevel(uuid: string) {
  const attemptedLevels = getData(metadataKeys.attemptedLevels) || [];

  const updatedData = await getSpecificEntry("userLevels", uuid) as UserLevelDocument;
  const success = await updateDocument("userLevels", uuid, {
    attempts: updatedData.attempts + 1,
    winrate: updatedData.wins / (updatedData.attempts + 1),
  });

  if (success && !attemptedLevels.includes(uuid)) {
    attemptedLevels.push(uuid);
    setData(metadataKeys.likedLevels, attemptedLevels);
  }

  return success;
}

export async function markUserLevelCompleted(uuid: string, moveHistory: Direction[]) {
  const completedLevels = getData(metadataKeys.completedLevels) || [];
  const firstCompletion = !completedLevels.includes(uuid);

  const prevData = await getSpecificEntry("userLevels", uuid) as UserLevelDocument;
  const updatedData: any = { best: Math.min(prevData.best, moveHistory.length) };
  if (firstCompletion) {
    updatedData.wins = prevData.wins + 1;
    updatedData.winrate = (prevData.wins + 1) / prevData.attempts;
  }

  createDocument("levelSolutions", undefined, {
    level_id: uuid,
    solution: moveHistory.join(""),
  });
  const success = await updateDocument("userLevels", uuid, updatedData);
  if (success && firstCompletion) {
    completedLevels.push(uuid);
    setData(metadataKeys.likedLevels, completedLevels);
  }

  return success;
}

// ========================== \\
// COLLECTION QUERY FUNCTIONS \\

export interface ExplicitOrder {
  field: string,
  order: "asc" | "desc",
}

export interface QueryFilter {
  field: string,
  operator: WhereFilterOp,
  value: any,
}

export function createFirebaseQuery(
  collectionName: string,
  pageSize: number,
  orderFields: ExplicitOrder[] = [],
  filters: QueryFilter[] = [],
) {
  let q: Query = collection(db, collectionName);
  filters.forEach(filter => q = query(q, where(filter.field, filter.operator, filter.value)));
  orderFields.forEach(field => q = query(q, orderBy(field.field, field.order)));
  q = query(q, limit(pageSize));
  return q;
}

// export async function doesEntryExist(collectionName: string, docName: string): Promise<boolean> {
//   const q = query(collection(db, collectionName), where(documentId(), "==", docName)); // TODO: evaluate difference between documentId() and "__name__"
//   const snap = await getCountFromServer(q);
//   return !!snap.data().count;
// }

// export async function getEntryCount(collectionName: string): Promise<number> {
//   const q = query(collection(db, collectionName));
//   const snap = await getCountFromServer(q);
//   return snap.data().count;
// }

export async function getAllEntries(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return parseQuerySnapshot(querySnapshot);
}

export async function getEntryCountFromQuery(query: Query) {
  const snap = await getCountFromServer(query);
  return snap.data().count;
}

export async function getEntriesFromQuery(query: Query) {
  const querySnapshot = await getDocs(query);
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
    next.uuid = doc.id;
    docs.push(next);
  });

  return docs;
}
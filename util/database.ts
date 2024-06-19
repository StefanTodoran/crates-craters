import { DocumentData, DocumentReference, Query, QuerySnapshot, Timestamp, WhereFilterOp, addDoc, collection, doc, getCountFromServer, getDocs, limit, orderBy, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { getData, getStoredLevelCount, metadataKeys, multiStoreLevels, parseCompressedBoardData, setData } from "./loader";

import { db } from "./firebase";
import { Direction, OfficialLevel } from "./types";
import { doStateStorageSync } from "./events";

// import { setLogLevel } from "firebase/firestore";
// setLogLevel("debug");

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
  name: string,
  board: string,
  designer: string,
  user_email: string,
  shared: Timestamp,
  attempts: number,
  wins: number,
  winrate: number,
  likes: number,
  best: number,
  keywords: string[], // Space-seperated contents of name and designer
}

export interface UserAccountDocument {
  user_email: string,
  likes: string[],
  attempted: string[],
  completed: string[],
  coins: number,
}

// ==================== \\
// HIGH LEVEL FUNCTIONS \\

export async function checkForOfficialLevelUpdates(): Promise<number> {
  const metadata: MetadataDocument = await getSpecificEntryByName("metadata", "metadata");
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
export async function likeUserLevel(level_id: string, user_email: string) {
  const likedLevels = getData(metadataKeys.likedLevels) || [];
  if (likedLevels.includes(level_id)) return false;

  try {
    const success = await runTransaction(db, async (transaction) => {
      const userLevelRef = doc(db, "userLevels", level_id);
      const userLevelDoc = await transaction.get(userLevelRef);
      const userLevelData = userLevelDoc.data() as UserLevelDocument;

      const userAccountRef = doc(db, "userAccounts", user_email);
      likedLevels.push(level_id);

      transaction.update(userLevelRef, { likes: userLevelData.likes + 1 });
      transaction.update(userAccountRef, { likes: likedLevels });
      setData(metadataKeys.likedLevels, likedLevels);
      return true;
    });

    return success;
  } catch (error) {
    console.error("Error liking level:", level_id, error);
    return false;
  }
}

export async function attemptUserLevel(level_id: string, user_email?: string | null) {
  const attemptedLevels = getData(metadataKeys.attemptedLevels) || [];
  if (attemptedLevels.includes(level_id)) return false;
  if (!user_email) {
    // We still want to keep track, server side will be updated when the
    // user eventually makes an account.
    attemptedLevels.push(level_id);
    setData(metadataKeys.attemptedLevels, attemptedLevels);
    return false;
  }

  try {
    const success = await runTransaction(db, async (transaction) => {
      const userLevelRef = doc(db, "userLevels", level_id);
      const userLevelDoc = await transaction.get(userLevelRef);
      const userLevelData = userLevelDoc.data() as UserLevelDocument;

      const userAccountRef = doc(db, "userAccounts", user_email);
      attemptedLevels.push(level_id);

      transaction.update(userLevelRef, { attempts: userLevelData.attempts + 1 });
      transaction.update(userAccountRef, { attempts: attemptedLevels });
      setData(metadataKeys.attemptedLevels, attemptedLevels);
      return true;
    });

    return success;
  } catch (error) {
    console.error("Error marking level attempted:", level_id, error);
    return false;
  }
}

export async function markUserLevelCompleted(
  level_id: string,
  user_email: string | null | undefined,
  moveHistory: Direction[],
) {
  const completedLevels = getData(metadataKeys.completedLevels) || [];
  const firstCompletion = !completedLevels.includes(level_id);
  if (!user_email) {
    completedLevels.push(level_id);
    setData(metadataKeys.completedLevels, completedLevels);
    return;
  }

  try {
    const success = await runTransaction(db, async (transaction) => {
      const userLevelRef = doc(db, "userLevels", level_id);
      const userLevelDoc = await transaction.get(userLevelRef);
      const userLevelData = userLevelDoc.data() as UserLevelDocument;

      const userAccountRef = doc(db, "userAccounts", user_email);

      const levelSolnRef = doc(collection(db, "levelSolutions"));
      transaction.set(levelSolnRef, {
        level_id: level_id,
        user_email: user_email,
        solution: moveHistory.join(""),
        moves: moveHistory.length,
      });

      if (!firstCompletion) {
        completedLevels.push(level_id);
        transaction.update(userLevelRef, {
          wins: userLevelData.wins + 1,
          winrate: (userLevelData.wins + 1) / userLevelData.attempts,
        });
      }

      transaction.update(userAccountRef, { completed: completedLevels });
      setData(metadataKeys.completedLevels, completedLevels);
      return true;
    });

    return success;
  } catch (error) {
    console.error("Error marking level completed:", level_id, error);
    return false;
  }
}

export async function postSolutionData(
  level_id: string,
  user_email: string | null | undefined,
  moveHistory: Direction[],
) {
  return createDocument("levelSolutions", undefined, {
    level_id: level_id,
    user_email: user_email,
    solution: moveHistory.join(""),
    moves: moveHistory.length,
  });
}

export async function getUserData(username: string) {
  return getSpecificEntryByName("userAccounts", username);
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
  if (pageSize !== -1) q = query(q, limit(pageSize));
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

export async function getEntryCountFromQuery(q: Query) {
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function getEntriesFromQuery(q: Query) {
  const querySnapshot = await getDocs(q);
  return parseQuerySnapshot(querySnapshot);
}

export async function getSpecificEntry(q: Query) {
  const querySnapshot = await getDocs(q);
  const docs = parseQuerySnapshot(querySnapshot);

  if (docs.length === 0) {
    throw new Error(`No document matching query "${q}" found.`);
  }
  else if (docs.length === 1) return docs[0]; // Success case
  else {
    console.warn(`Found multiple records matching query "${q}"!`);
    console.warn(`Using first document returned by query snapshot.`);
    return docs[0];
  }
}

export async function getSpecificEntryByName(collectionName: string, docName: string) {
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
import { DocumentData, DocumentReference, Query, QuerySnapshot, Timestamp, WhereFilterOp, addDoc, collection, doc, getCountFromServer, getDocs, limit, orderBy, query, runTransaction, setDoc, updateDoc, where } from "firebase/firestore";
import { doStateStorageSync } from "./events";
import { db } from "./firebase";
import { compressBoardData, getData, getLocalUserData, getStoredLevelCount, metadataKeys, multiStoreLevels, parseCompressedBoardData, setData } from "./loader";
import { Direction, OfficialLevel, SharedLevel, UserLevel } from "./types";

import { UserCredential } from "firebase/auth";
import { setLogLevel } from "firebase/firestore";
import { Tutorial } from "../components/TutorialHint";
setLogLevel("debug");

// ======================== \\
// DOCUMENT TYPE INTERFACES \\

interface MetadataDocument {
  officialLevelsUpdated: Timestamp,
  dataVersionCode: number,
}

export interface OfficialLevelDocument {
  uuid: string,
  name: string,
  board: string,
  order: number,
  introduces: Tutorial,
}

export interface UserLevelDocument {
  name: string,
  board: string,
  user_name: string,
  user_email: string,
  shared: Timestamp,
  attempts: number,
  wins: number,
  winrate: number,
  likes: number,
  best: number,
  bestSolution: string,
  keywords: string[], // Space-seperated contents of name and designer
  public: boolean,
}

export interface UserAccountDocument {
  user_email: string,
  user_name: string,
  likes: string[],
  attempted: string[],
  completed: string[],
  coins: number,
  local_uuid: string,
  local_joined: Timestamp,
  online_joined: Timestamp,
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

    multiStoreLevels(levels);
    setData(metadataKeys.lastUpdatedOfficialLevels, metadata.officialLevelsUpdated);
    setData(metadataKeys.lastDataVersionCode, metadata.dataVersionCode);

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

  rawLevels.forEach(rawLevel => {
    const existingLevel: OfficialLevel = getData(rawLevel.uuid);
    const updatedLevel: OfficialLevel = {
      uuid: rawLevel.uuid,
      name: rawLevel.name,
      board: parseCompressedBoardData(rawLevel.board),
      completed: existingLevel?.completed,
      bestSolution: existingLevel?.bestSolution,
      official: true,
      order: rawLevel.order,
      introduces: rawLevel.introduces,
    };

    parsedLevels.push(updatedLevel);
  });

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
      transaction.update(userAccountRef, { attempted: attemptedLevels });
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
  level: SharedLevel,
  userEmail: string | null | undefined,
  moveHistory: Direction[],
) {
  const userData = getLocalUserData();
  const completedLevels = getData(metadataKeys.completedLevels) || [];
  const firstCompletion = !completedLevels.includes(level.uuid);
  if (!userEmail) {
    completedLevels.push(level.uuid);
    setData(metadataKeys.completedLevels, completedLevels);
    return;
  }

  try {
    const success = await runTransaction(db, async (transaction) => {
      const userLevelRef = doc(db, "userLevels", level.uuid);
      const userLevelDoc = await transaction.get(userLevelRef);
      const userLevelData = userLevelDoc.data() as UserLevelDocument;
      const userAccountRef = doc(db, "userAccounts", userEmail);

      const levelSolnRef = doc(collection(db, "levelSolutions"));
      transaction.set(levelSolnRef, {
        level_id: level.uuid,
        user_email: userEmail,
        local_uuid: userData?.uuid,
        solution: moveHistory.join(""),
        moves: moveHistory.length,
        type: "user_level",
      });

      if (firstCompletion) {
        completedLevels.push(level.uuid);
        const updateData: Partial<UserLevelDocument> = {
          wins: userLevelData.wins + 1,
          winrate: (userLevelData.wins + 1) / userLevelData.attempts,
        };
        if (moveHistory.length < level.best) {
          updateData.best = moveHistory.length;
          updateData.bestSolution = moveHistory.join("");
        }
        transaction.update(userLevelRef, updateData);
      }

      transaction.update(userAccountRef, { completed: completedLevels });
      setData(metadataKeys.completedLevels, completedLevels);
      return true;
    });

    return success;
  } catch (error) {
    console.error("Error marking level completed:", level.uuid, error);
    return false;
  }
}

export async function publishUserLevel(
  level: UserLevel,
  userData: UserAccountDocument,
  userCredential: UserCredential,
  shared: Timestamp,
) {
  const userLevelRef = await runTransaction(db, async (transaction) => {
    // Use the existing document name if we are publishing again, otherwise create a new document.
    const userLevelRef = level.db_id ? doc(db, "userLevels", level.db_id) : doc(collection(db, "userLevels"));
    const userLevelDoc: UserLevelDocument = {
      name: level.name,
      board: compressBoardData(level.board),
      user_name: userData!.user_name,
      user_email: userCredential!.user.email!,
      shared: shared,
      attempts: 0,
      wins: 0,
      winrate: 1,
      likes: 0,
      best: level.bestSolution!.length,
      bestSolution: level.bestSolution!, // Guaranteed to be defined since button is disabled if !level.completed
      keywords: [...level.name.toLowerCase().split(/\s+/), ...userData!.user_name.toLowerCase().split(/\s+/)],
      public: true,
    };
    transaction.set(userLevelRef, userLevelDoc);

    const levelSolnRef = doc(collection(db, "levelSolutions"));
    transaction.set(levelSolnRef, {
      level_id: level.uuid,
      user_email: userCredential.user.email!,
      local_uuid: userData!.local_uuid,
      solution: level.bestSolution!,
      moves: level.bestSolution!.length,
      type: "user_level",
    });

    return userLevelRef;
  });

  return userLevelRef;
}

export async function postSolutionData(
  level_id: string,
  user_email: string | null | undefined,
  moveHistory: Direction[],
) {
  const userData = getLocalUserData();
  try {
    createDocument("levelSolutions", undefined, {
      level_id: level_id,
      user_email: user_email ?? "undefined",
      local_uuid: userData.uuid,
      solution: moveHistory.join(""),
      moves: moveHistory.length,
      type: "official_level",
    });
  } catch (error) {
    console.error("Error posting solution data:", level_id, error);
  }
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

/**
 * @param fieldName Use "__name__" to match document name.
 */
export async function doesEntryExist(collectionName: string, fieldName: string, fieldValue: string): Promise<boolean> {
  const q = query(collection(db, collectionName), where(fieldName, "==", fieldValue));
  const snap = await getCountFromServer(q);
  return !!snap.data().count;
}

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
): Promise<DocumentReference> {
  let newDoc;

  if (docName) {
    newDoc = doc(db, collectionName, docName);
    await setDoc(newDoc, docContent);
  } else {
    // If no document name provided, use auto generated firestore document id
    newDoc = await addDoc(collection(db, collectionName), docContent);
  }

  return newDoc;
}

export async function updateDocument(
  collectionName: string,
  docName: string,
  updateContent: any,
): Promise<void> {
  const documentRef = doc(db, collectionName, docName);
  return await updateDoc(documentRef, updateContent);
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
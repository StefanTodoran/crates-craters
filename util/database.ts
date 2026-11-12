import { DocumentData, DocumentReference, Query, QuerySnapshot, Timestamp, WhereFilterOp, addDoc, arrayUnion, collection, doc, getCountFromServer, getDoc, getDocs, increment, limit, orderBy, query, runTransaction, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { doStateStorageSync } from "./events";
import { auth, db } from "./firebase";
import { compressBoardData, getData, getStoredLevelCount, metadataKeys, multiStoreLevels, parseCompressedBoardData, setData } from "./loader";
import { Direction, OfficialLevel, SharedLevel, Tutorial, UserLevel } from "./types";

import { User, UserCredential, deleteUser } from "firebase/auth";
import { setLogLevel } from "firebase/firestore";
if (__DEV__) setLogLevel("debug");

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
  introduces: Tutorial[],
}

export interface UserLevelDocument {
  name: string,
  board: string,
  user_name: string,
  user_uid: string,
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

/** Display name given to levels whose creator deleted their account. */
export const DELETED_USER_NAME = "Deleted user";

// Each like, attempt and win is backed by a marker doc at userLevels/{level}/{kind}/{uid}.
// The rules only let a counter go up by one in the same write that creates the
// caller's marker, so each user can bump each counter once.
type StatKind = "likes" | "attempts" | "wins";
const markerRef = (level_id: string, kind: StatKind, uid: string) => doc(db, "userLevels", level_id, kind, uid);

/** Increments a level counter once per user. Resolves true if this call recorded it. */
async function recordUserLevelStat(level_id: string, uid: string, kind: StatKind, accountField: string) {
  return runTransaction(db, async (transaction) => {
    const marker = await transaction.get(markerRef(level_id, kind, uid));
    if (marker.exists()) return false; // Already counted, e.g. from another device.

    transaction.update(doc(db, "userLevels", level_id), { [kind]: increment(1) });
    transaction.set(marker.ref, {});
    transaction.update(doc(db, "userAccounts", uid), { [accountField]: arrayUnion(level_id) });
    return true;
  });
}

export async function likeUserLevel(level_id: string, uid: string) {
  const likedLevels = getData(metadataKeys.likedLevels) || [];
  if (likedLevels.includes(level_id)) return false;

  try {
    await recordUserLevelStat(level_id, uid, "likes", "likes");
    // Only record locally once the server write has succeeded.
    setData(metadataKeys.likedLevels, [...likedLevels, level_id]);
    return true;
  } catch (error) {
    console.error("Error liking level:", level_id, error);
    return false;
  }
}

export async function attemptUserLevel(level_id: string, uid?: string | null) {
  const attemptedLevels = getData(metadataKeys.attemptedLevels) || [];
  if (attemptedLevels.includes(level_id)) return false;
  if (!uid) {
    // We still want to keep track, server side will be updated when the
    // user eventually makes an account.
    setData(metadataKeys.attemptedLevels, [...attemptedLevels, level_id]);
    return false;
  }

  try {
    await recordUserLevelStat(level_id, uid, "attempts", "attempted");
    setData(metadataKeys.attemptedLevels, [...attemptedLevels, level_id]);
    return true;
  } catch (error) {
    console.error("Error marking level attempted:", level_id, error);
    return false;
  }
}

export async function markUserLevelCompleted(
  level: SharedLevel,
  uid: string | null | undefined,
  moveHistory: Direction[],
) {
  const completedLevels = getData(metadataKeys.completedLevels) || [];
  postSolutionData(level.uuid, moveHistory, "user_level");
  if (!uid) {
    if (!completedLevels.includes(level.uuid)) setData(metadataKeys.completedLevels, [...completedLevels, level.uuid]);
    return;
  }

  try {
    await runTransaction(db, async (transaction) => {
      const userLevelRef = doc(db, "userLevels", level.uuid);
      const userLevelDoc = await transaction.get(userLevelRef);
      const winMarker = await transaction.get(markerRef(level.uuid, "wins", uid));
      const userLevelData = userLevelDoc.data() as UserLevelDocument;

      const updateData: Partial<UserLevelDocument> = {};
      if (!winMarker.exists()) {
        updateData.wins = userLevelData.wins + 1;
        // Attempts can lag behind wins (e.g. attempts made while signed out are only
        // recorded locally), so clamp to keep the winrate a valid fraction.
        updateData.winrate = Math.min(1, updateData.wins / Math.max(1, userLevelData.attempts));
        transaction.set(winMarker.ref, {});
      }
      if (moveHistory.length < userLevelData.best) {
        updateData.best = moveHistory.length;
        updateData.bestSolution = moveHistory.join("");
      }
      if (Object.keys(updateData).length) transaction.update(userLevelRef, updateData);

      // arrayUnion keeps entries added from other devices. Local storage is only
      // written after the commit below, since this callback can be retried.
      transaction.update(doc(db, "userAccounts", uid), { completed: arrayUnion(level.uuid) });
    });

    if (!completedLevels.includes(level.uuid)) setData(metadataKeys.completedLevels, [...completedLevels, level.uuid]);
    return true;
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
  // Use the existing document name if we are publishing again, otherwise create a new document.
  const userLevelRef = level.db_id ? doc(db, "userLevels", level.db_id) : doc(collection(db, "userLevels"));
  const userLevelDoc: UserLevelDocument = {
    name: level.name,
    board: compressBoardData(level.board),
    user_name: userData!.user_name,
    user_uid: userCredential!.user.uid,
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
  await setDoc(userLevelRef, userLevelDoc);
  return userLevelRef;
}

/** Local record of the shortest solution posted per user and level, so we only write improvements. */
const POSTED_SOLUTIONS_KEY = "postedSolutionMoves";

/**
 * Records a solution at levelSolutions/{level}_{uid}, keeping only each user's shortest.
 * Signed-out players post under their anonymous uid. Analytics only, so failures are ignored.
 */
export async function postSolutionData(
  level_id: string,
  moveHistory: Direction[] | string,
  type: "official_level" | "user_level",
) {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  const solution = typeof moveHistory === "string" ? moveHistory : moveHistory.join("");
  const posted: Record<string, number> = getData(POSTED_SOLUTIONS_KEY) || {};
  const key = `${uid}/${level_id}`;
  if (posted[key] !== undefined && posted[key] <= solution.length) return;

  try {
    await setDoc(doc(db, "levelSolutions", `${level_id}_${uid}`), {
      level_id: level_id,
      user_uid: uid,
      solution: solution,
      moves: solution.length,
      type: type,
    });
    setData(POSTED_SOLUTIONS_KEY, { ...posted, [key]: solution.length });
  } catch (error) {
    // Rejected if the server already has a solution at least this short (e.g. from before
    // this device tracked it), so remember not to retry this length.
    if ((error as any)?.code === "permission-denied") setData(POSTED_SOLUTIONS_KEY, { ...posted, [key]: solution.length });
    else console.warn("Error posting solution data:", level_id, error);
  }
}

export async function getUserData(uid: string) {
  return getSpecificEntryByName("userAccounts", uid);
}

// Usernames are claimed in usernames/{lowercased name} -> { uid }, which keeps them
// unique and lets the rules check that published levels carry the creator's own name.
const usernameRef = (userName: string) => doc(db, "usernames", userName.toLowerCase());

export async function isUsernameTaken(userName: string) {
  return (await getDoc(usernameRef(userName))).exists();
}

/** Claims the username and creates the account doc in one write. */
export async function createUserAccount(uid: string, accountDoc: UserAccountDocument) {
  const batch = writeBatch(db);
  batch.set(usernameRef(accountDoc.user_name), { uid });
  batch.set(doc(db, "userAccounts", uid), accountDoc);
  await batch.commit();
}

/**
 * Deletes the account: published levels stay playable but are attributed to a deleted
 * user, then the username, account doc and auth user are removed. The caller must have
 * signed in recently (Firebase requires it for deleteUser).
 */
export async function deleteUserAccount(user: User, userName: string | undefined) {
  const levels = await getDocs(query(collection(db, "userLevels"), where("user_uid", "==", user.uid)));
  const batch = writeBatch(db);
  levels.forEach(level => batch.update(level.ref, {
    user_uid: "",
    user_name: DELETED_USER_NAME,
    keywords: (level.data().name as string).toLowerCase().split(/\s+/),
  }));
  if (userName) batch.delete(usernameRef(userName));
  batch.delete(doc(db, "userAccounts", user.uid));
  await batch.commit();
  await deleteUser(user);
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

/** Firestore allows at most 30 values in an "in" filter. */
const IN_FILTER_LIMIT = 30;

function chunk<T>(list: T[], size: number) {
  const chunks: T[][] = [];
  for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
  return chunks;
}

function compareByOrder(a: any, b: any, orderFields: ExplicitOrder[]) {
  for (const { field, order } of orderFields) {
    const av = a[field] instanceof Timestamp ? a[field].toMillis() : a[field];
    const bv = b[field] instanceof Timestamp ? b[field].toMillis() : b[field];
    if (av === bv) continue;
    const result = av < bv ? -1 : 1;
    return order === "asc" ? result : -result;
  }
  return 0;
}

/**
 * Queries shared levels, optionally restricted to (includeIds) or excluding
 * (excludeIds) specific level ids. Firestore caps "in" at 30 values and can't combine
 * "not-in" with "!=", so includes are chunked and merged, and excludes are applied
 * client-side with exact counts from chunked count queries.
 */
export async function queryUserLevels(
  orderFields: ExplicitOrder[],
  filters: QueryFilter[],
  pageSize: number,
  includeIds?: string[],
  excludeIds: string[] = [],
) {
  if (includeIds !== undefined) {
    if (includeIds.length === 0) return { data: [], count: 0 };
    const chunks = chunk(includeIds, IN_FILTER_LIMIT);
    const results = await Promise.all(chunks.map(ids => {
      const chunkFilters: QueryFilter[] = [...filters, { field: "__name__", operator: "in", value: ids }];
      return Promise.all([
        getEntriesFromQuery(createFirebaseQuery("userLevels", pageSize, orderFields, chunkFilters)),
        // Count without the page limit, so "Showing X of Y" reports the real total.
        getEntryCountFromQuery(createFirebaseQuery("userLevels", -1, [], chunkFilters)),
      ]);
    }));
    const merged = results.flatMap(([data]) => data).sort((a, b) => compareByOrder(a, b, orderFields));
    const data = merged.filter(doc => !excludeIds.includes(doc.uuid)).slice(0, pageSize);
    const count = results.reduce((sum, [, n]) => sum + n, 0);
    return { data, count };
  }

  // Over-fetch so that, after dropping excluded levels, a full page remains.
  const q = createFirebaseQuery("userLevels", pageSize === -1 ? -1 : pageSize + excludeIds.length, orderFields, filters);
  const excludedCountQueries = chunk(excludeIds, IN_FILTER_LIMIT).map(ids =>
    getEntryCountFromQuery(createFirebaseQuery("userLevels", -1, [], [...filters, { field: "__name__", operator: "in", value: ids }]))
  );
  const [docs, total, ...excludedCounts] = await Promise.all([
    getEntriesFromQuery(q),
    getEntryCountFromQuery(createFirebaseQuery("userLevels", -1, [], filters)),
    ...excludedCountQueries,
  ]);
  const data = docs.filter(doc => !excludeIds.includes(doc.uuid)).slice(0, pageSize === -1 ? undefined : pageSize);
  const count = total - excludedCounts.reduce((sum, n) => sum + n, 0);
  return { data, count };
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
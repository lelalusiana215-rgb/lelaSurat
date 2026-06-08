import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp,
  type Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific settings for stability in containerized/web environments
console.log("Initializing Firestore with DB:", firebaseConfig.firestoreDatabaseId || "(default)");
export const db: Firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  
  let friendlyError = errMessage;
  if (errMessage.includes('permission-denied')) {
    friendlyError = 'Akses ditolak (Permission Denied). Periksa konfigurasi keamanan Firebase.';
  } else if (errMessage.includes('unavailable') || errMessage.includes('offline')) {
    friendlyError = 'Database sedang luring atau tidak dapat dijangkau.';
  } else if (errMessage.includes('quota-exceeded')) {
    friendlyError = 'Kuota database terlampaui.';
  }

  const errInfo: FirestoreErrorInfo = {
    error: friendlyError,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  
  console.error(`Firebase [${operationType}] Error on [${path}]:`, errMessage);
  
  if (errMessage.includes('offline') || errMessage.includes('unavailable')) {
    // Return a special error instead of throwing to allow local mode fallback
    return { error: friendlyError, isOffline: true };
  }
  
  throw new Error(JSON.stringify(errInfo));
}

let initialized = false;

export const initFirebase = async () => {
  initialized = true;
  return { ok: true };
};

export const getFirebaseDb = () => db;

// CRUD Helpers
export const upsertSchoolData = async (data: any) => {
  const path = 'school_data';
  try {
    const docRef = doc(db, path, 'settings');
    await setDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
};

export const getSchoolData = async () => {
  const path = 'school_data';
  try {
    const docRef = doc(db, path, 'settings');
    const snap = await getDoc(docRef);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    const err = handleFirestoreError(e, OperationType.GET, path);
    if (typeof err === 'object' && 'isOffline' in err) return null; // Fallback to local
    throw e;
  }
};

export const addSuratHistory = async (surat: any) => {
  const path = 'surat_history';
  try {
    const id = surat.id ? String(surat.id) : doc(collection(db, path)).id;
    const docRef = doc(db, path, id);
    await setDoc(docRef, {
      ...surat,
      id,
      authorId: auth.currentUser?.uid || 'anonymous',
      timestamp: serverTimestamp()
    });
    return id;
  } catch (e) {
    const err = handleFirestoreError(e, OperationType.WRITE, path);
    if (typeof err === 'object' && 'isOffline' in err) return null;
    throw e;
  }
};

export const getSuratHistoryList = async () => {
  const path = 'surat_history';
  try {
    const q = query(collection(db, path));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
    return data.sort((a: any, b: any) => {
      const dateA = a.tanggalBuat ? new Date(a.tanggalBuat).getTime() : 0;
      const dateB = b.tanggalBuat ? new Date(b.tanggalBuat).getTime() : 0;
      return dateB - dateA;
    });
  } catch (e) {
    const err = handleFirestoreError(e, OperationType.LIST, path);
    if (typeof err === 'object' && 'isOffline' in err) return [];
    throw e;
  }
};

export const deleteSuratHistory = async (id: string) => {
  const path = 'surat_history';
  try {
    await deleteDoc(doc(db, path, id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, path);
  }
};

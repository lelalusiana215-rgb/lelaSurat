import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let initialized = false;

export const initFirebase = async () => {
  if (initialized) return { ok: true };
  try {
    await getDocFromServer(doc(db, 'test', 'connection')).catch(err => {
      if (err.message.includes('the client is offline')) {
         console.warn("Client is offline or check rules");
      }
    });
    initialized = true;
    return { ok: true };
  } catch (e: any) {
    console.error("Failed to initialize Firebase", e);
    return { ok: false, error: e.message };
  }
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
    handleFirestoreError(e, OperationType.GET, path);
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
      timestamp: serverTimestamp()
    });
    return id;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
};

export const getSuratHistoryList = async () => {
  const path = 'surat_history';
  try {
    const q = query(collection(db, path), orderBy('tanggalBuat', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id }));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
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

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User
} from 'firebase/auth';
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
  type Firestore,
  where,
  onSnapshot
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
const googleProvider = new GoogleAuthProvider();

export const ADMIN_EMAIL = 'lelalusiana215@gmail.com';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  status: 'pending' | 'approved' | 'rejected';
  role: 'admin' | 'user';
  requestedAt: any;
  updatedAt: any;
}

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
  } else if (errMessage.includes('not-found') || errMessage.includes('Database \'(default)\' not found')) {
    friendlyError = 'Database Firestore "(default)" belum dibuat di Firebase Console. Silakan buka Firebase Console dan klik "Create Database" pada bagian Firestore.';
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

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (e) {
    console.error("Auth Error:", e);
    throw e;
  }
};

export const logout = () => signOut(auth);

// User Profile Management
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'user_profiles', uid);
    const snap = await getDoc(docRef);
    return snap.exists() ? (snap.data() as UserProfile) : null;
  } catch (e) {
    console.error("Error getting profile:", e);
    return null;
  }
};

export const requestAccess = async (user: User) => {
  const path = 'user_profiles';
  try {
    const isOwner = user.email === ADMIN_EMAIL;
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'User',
      photoURL: user.photoURL || '',
      status: isOwner ? 'approved' : 'pending',
      role: isOwner ? 'admin' : 'user',
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, path, user.uid), profile, { merge: true });
    return profile;
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, path);
  }
};

export const getAllUserProfiles = async (): Promise<UserProfile[]> => {
  const path = 'user_profiles';
  try {
    const q = query(collection(db, path), orderBy('requestedAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as UserProfile);
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, path);
    return [];
  }
};

export const updateUserStatus = async (uid: string, status: 'approved' | 'rejected') => {
  const path = 'user_profiles';
  try {
    await setDoc(doc(db, path, uid), { 
      status,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, path);
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

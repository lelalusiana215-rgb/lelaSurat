import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); 
export const auth = getAuth(app);

let initialized = false;

export const initFirebase = async () => {
  if (initialized) return true;
  try {
    // Attempt a dummy read to test connection if needed, though initializeApp handles networking gracefully
    await getDocFromServer(doc(db, 'test', 'connection')).catch(err => {
      if (err.message.includes('the client is offline')) {
         console.warn("Client is offline or check rules");
      }
    });
    initialized = true;
    return true;
  } catch (e) {
    console.error("Failed to initialize Firebase", e);
    return false;
  }
};

export const getFirebaseDb = () => db;

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const saveContestData = async (rules: any, participants: any) => {
  try {
    const docRef = doc(db, 'config', 'contest');
    await setDoc(docRef, {
      rules,
      participants,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error('Failed to save contest data to Firestore:', error);
    return false;
  }
};

export const loadContestData = async () => {
  try {
    const docRef = doc(db, 'config', 'contest');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    console.error('Failed to load contest data from Firestore:', error);
  }
  return null;
};

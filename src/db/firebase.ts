import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const stripUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc: any, [key, value]) => {
      if (value !== undefined) {
        acc[key] = stripUndefined(value);
      }
      return acc;
    }, {});
  }
  return obj;
};

export const saveContestData = async (rules: any, participants: any) => {
  try {
    const docRef = doc(db, 'config', 'contest');
    const cleanData = stripUndefined({
      rules,
      participants,
      updatedAt: new Date().toISOString()
    });
    await setDoc(docRef, cleanData, { merge: true });
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

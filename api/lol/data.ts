import "dotenv/config";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import fs from "fs";
import path from "path";

// Load configuration
let firebaseConfig: any;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e: any) {
  console.error("Error loading firebase config:", e.message);
}

// Initialize Firebase
const firebaseApp = firebaseConfig ? initializeApp(firebaseConfig) : null;
const db = firebaseApp ? getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId) : null;

export default async function handler(req: any, res: any) {
  if (!db) {
    return res.status(500).json({ error: "Firestore not initialized." });
  }

  if (req.method === "GET") {
    try {
      const docRef = doc(db, "config", "contest");
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return res.json({ rules: null, participants: null });
      }
      
      return res.json(docSnap.data());
    } catch (error: any) {
      console.error("[Data Get] Error:", error.message);
      return res.status(500).json({ error: error.message || "Failed to load contest data" });
    }
  }

  if (req.method === "POST") {
    try {
      const { rules, participants } = req.body;
      const docRef = doc(db, "config", "contest");
      
      await setDoc(docRef, { 
        rules, 
        participants,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      return res.json({ success: true });
    } catch (error: any) {
      console.error("[Data Post] Error:", error.message);
      return res.status(500).json({ error: error.message || "Failed to save contest data" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).end(`Method ${req.method} Not Allowed`);
}

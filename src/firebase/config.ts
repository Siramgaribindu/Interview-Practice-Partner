import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  projectId: "gen-lang-client-0741724590",
  appId: "1:700690273350:web:710183cfaaceb257ae2647",
  apiKey: "AIzaSyBt_NzFDUy_ARkdtFZmErU1lWv2MyDkggU",
  authDomain: "gen-lang-client-0741724590.firebaseapp.com",
  databaseId: "ai-studio-61572c50-7ee9-4240-9067-c33283b82b7c",
  storageBucket: "gen-lang-client-0741724590.firebasestorage.app",
  messagingSenderId: "700690273350"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.databaseId);

// Connection test helper per Firebase skill requirements
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Connection verified successfully.");
    return true;
  } catch (error: any) {
    if (error instanceof Error && error.message.includes("offline")) {
      console.warn("Firebase client is currently offline or configuration is invalid:", error);
    } else {
      console.log("Firebase connection test complete (it might error if document does not exist, which is expected, but network was reached):", error?.message);
    }
    return false;
  }
}

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyALOzlP6bHcy9JCQKWRH4E9S6Yq-HvhEN4",
  authDomain: "vertical-golf-mgi.firebaseapp.com",
  projectId: "vertical-golf-mgi",
  storageBucket: "vertical-golf-mgi.firebasestorage.app",
  messagingSenderId: "372577677712",
  appId: "1:372577677712:web:6d2b3898405b625a718315"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
export const storage = getStorage(app);

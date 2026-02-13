import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB-b7_pTPrEw7U4l5cCm0dkn2YJiNKtGjU",
  authDomain: "fortune-teller-c524f.firebaseapp.com",
  projectId: "fortune-teller-c524f",
  storageBucket: "fortune-teller-c524f.firebasestorage.app",
  messagingSenderId: "827963178373",
  appId: "1:827963178373:web:1ffcde8d664b31847f58ec",
  measurementId: "G-SE8KSLKTVE"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

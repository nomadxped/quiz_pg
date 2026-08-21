import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxxTProEI30fqGp-cXgnu_yeliuaMeb5k",
  authDomain: "pgdca-28224.firebaseapp.com",
  projectId: "pgdca-28224",
  storageBucket: "pgdca-28224.firebasestorage.app",
  messagingSenderId: "1087268383769",
  appId: "1:1087268383769:web:73be6e1ca3469a4e468e88",
  measurementId: "G-RRWS6ZQ6M7"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

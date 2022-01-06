import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhdGWVOjk57ee8qunqdSiACQ7ZfJo697w",
  authDomain: "patientenruf.firebaseapp.com",
  projectId: "patientenruf",
  storageBucket: "patientenruf.appspot.com",
  messagingSenderId: "948239894858",
  appId: "1:948239894858:web:a0a733dc3f7fb164d919b3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();

export {app}
export {db}

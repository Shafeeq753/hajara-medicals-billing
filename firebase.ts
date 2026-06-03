import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase web config for the Hajara Medicals project.
// NOTE: a web apiKey is NOT a secret — it is meant to ship in client code.
// Access is controlled by Firestore security rules, not by hiding this key.
const firebaseConfig = {
  apiKey: 'AIzaSyBZlhIwC29MDnm7wSST7wRgU7KM92Q8KLM',
  authDomain: 'hajara-medicals-ce79a.firebaseapp.com',
  projectId: 'hajara-medicals-ce79a',
  storageBucket: 'hajara-medicals-ce79a.firebasestorage.app',
  messagingSenderId: '870541035180',
  appId: '1:870541035180:web:69a21c7f7af972099c4109',
  measurementId: 'G-Z8M210S5JK',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

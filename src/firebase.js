import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCBfY4IVJEQp9x_KmlmSLzvJcyoDyJXcg0",
  authDomain: "rera-stock.firebaseapp.com",
  projectId: "rera-stock",
  storageBucket: "rera-stock.firebasestorage.app",
  messagingSenderId: "795069011578",
  appId: "1:795069011578:web:303c8d8343a20c86280dc3",
  measurementId: "G-87MP6GQ6CT",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Product photos live here as real files (not inline base64 in Firestore) —
// keeps product documents small and cheap to read, on the website as much
// as in this app's own real-time product list.
export const storage = getStorage(app);

// Persistent cache: data is stored in IndexedDB so the app loads
// and shows stock even when offline. Writes queue and sync when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

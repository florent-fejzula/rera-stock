import { useState, useEffect, useRef } from 'react';
import { collection, onSnapshot, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_NAMES = ['Wigs', 'Extensions', 'Care', 'Tools', 'Accessories'];

/**
 * Subscribes to the Firestore `categories` collection.
 * On first login by any signed-in user, if the collection is empty, seeds the defaults.
 * Returns { categories: [{id, name}], names: [string], loading }
 */
export function useCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const seededRef = useRef(false);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'));
    const unsub = onSnapshot(q, async (snap) => {
      if (snap.empty && user && !seededRef.current) {
        seededRef.current = true;
        for (const name of DEFAULT_NAMES) {
          await addDoc(collection(db, 'categories'), { name, createdAt: serverTimestamp() });
        }
        return; // listener will fire again with the seeded docs
      }
      setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, [user]);

  return { categories, names: categories.map((c) => c.name), loading };
}

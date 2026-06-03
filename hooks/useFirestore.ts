import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Subscribe to a Firestore collection in real time.
 * Returns [items, loading]. Every document gets its Firestore id merged in as `id`.
 * Because this is a live `onSnapshot` listener, changes made anywhere (this tab,
 * another device, the Firebase console) show up here automatically.
 */
export function useCollection<T>(collectionName: string): [T[], boolean] {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, collectionName),
      snapshot => {
        const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as T));
        setData(items);
        setLoading(false);
      },
      err => {
        console.error(`Firestore listen failed for "${collectionName}":`, err);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [collectionName]);

  return [data, loading];
}

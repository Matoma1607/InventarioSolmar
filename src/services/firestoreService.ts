import { collection, doc, getDocs, setDoc, updateDoc, deleteDoc, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Item, Unit, HistoryEntry } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      // Basic info, could add more if needed
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firestoreService = {
  async getItems(): Promise<Item[]> {
    const p = 'items';
    try {
      const snap = await getDocs(collection(db, p));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as Item));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  },

  async saveItem(item: Partial<Item>): Promise<string> {
    const p = 'items';
    try {
      if (item.id) {
        const id = String(item.id);
        const { id: _, ...data } = item;
        await setDoc(doc(db, p, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
        return id;
      } else {
        const docRef = await addDoc(collection(db, p), { ...item, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        return docRef.id;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
      return '';
    }
  },

  async getUnits(): Promise<Unit[]> {
    const p = 'units';
    try {
      const snap = await getDocs(collection(db, p));
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as Unit));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  },

  async saveUnit(unit: Partial<Unit>): Promise<string> {
    const p = 'units';
    try {
      if (unit.id) {
        const id = String(unit.id);
        const { id: _, ...data } = unit;
        await setDoc(doc(db, p, id), data, { merge: true });
        return id;
      } else {
        const docRef = await addDoc(collection(db, p), unit);
        return docRef.id;
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
      return '';
    }
  },

  async getHistory(): Promise<HistoryEntry[]> {
    const p = 'history';
    try {
      const q = query(collection(db, p), orderBy('ts', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ ...d.data(), id: d.id } as unknown as HistoryEntry));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  },

  async addHistory(entry: Partial<HistoryEntry>): Promise<void> {
    const p = 'history';
    try {
      await addDoc(collection(db, p), { ...entry, ts: new Date().toISOString() });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, p);
    }
  },

  async getSucursales(): Promise<string[]> {
    const p = 'sucursales';
    try {
      const snap = await getDocs(collection(db, p));
      return snap.docs.map(d => (d.data() as any).nombre);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, p);
      return [];
    }
  }
};

import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { AppData } from '../types';
import { db } from '../firebase';

type CloudRecord = { id: string };

const recordCollections = [
  'orders',
  'tasks',
  'products',
  'movements',
  'technicians',
] as const;

export interface LoadedCloudData {
  data: AppData | null;
  revision: number;
}

export async function loadCloudData(): Promise<LoadedCloudData> {
  const snapshots = await Promise.all(
    recordCollections.map((name) => getDocs(collection(db, name))),
  );
  const settingsSnapshot = await getDoc(doc(db, 'gestorpro_meta', 'settings'));
  const hasRecords = snapshots.some((snapshot) => !snapshot.empty);

  if (!hasRecords) {
    return {
      data: null,
      revision: settingsSnapshot.exists() ? settingsSnapshot.data().revision ?? 0 : 0,
    };
  }

  const settings = settingsSnapshot.exists() ? settingsSnapshot.data() : {};
  return {
    revision: settings.revision ?? 0,
    data: {
    version: 2,
    lastUpdated: settings.lastUpdated ?? new Date().toISOString(),
    orders: snapshots[0].docs.map((item) => item.data()) as AppData['orders'],
    tasks: snapshots[1].docs.map((item) => item.data()) as AppData['tasks'],
    products: snapshots[2].docs.map((item) => item.data()) as AppData['products'],
    movements: snapshots[3].docs.map((item) => item.data()) as AppData['movements'],
    technicians: snapshots[4].docs.map((item) => item.data()) as AppData['technicians'],
    categories: settings.categories ?? [],
    teamMembers: settings.teamMembers ?? [],
    },
  };
}

export async function saveCloudData(data: AppData, expectedRevision: number): Promise<number> {
  const collections: Array<[string, CloudRecord[]]> = [
    ['orders', data.orders],
    ['tasks', data.tasks],
    ['products', data.products],
    ['movements', data.movements],
    ['technicians', data.technicians ?? []],
  ];
  const recordCount = collections.reduce((total, [, records]) => total + records.length, 1);
  if (recordCount > 450) {
    throw new Error('Hay demasiados registros para sincronizar en una sola operación.');
  }
  const existingSnapshots = await Promise.all(
    collections.map(([name]) => getDocs(collection(db, name))),
  );

  for (const [, records] of collections) {
    for (const record of records) {
      const size = new TextEncoder().encode(JSON.stringify(record)).length;
      if (size > 850_000) {
        throw new Error(`El registro ${record.id} es demasiado grande para Firestore. Reduce o comprime sus fotografías.`);
      }
    }
  }

  return runTransaction(db, async (transaction) => {
    const settingsRef = doc(db, 'gestorpro_meta', 'settings');
    const settingsSnapshot = await transaction.get(settingsRef);
    const currentRevision = settingsSnapshot.exists() ? settingsSnapshot.data().revision ?? 0 : 0;
    if (currentRevision !== expectedRevision) {
      throw new Error('Los datos cambiaron desde otra sesión. Recarga la aplicación antes de guardar más cambios.');
    }

    collections.forEach(([name, records], index) => {
      const ids = new Set(records.map((record) => record.id));
      existingSnapshots[index].docs.forEach((item) => {
        if (!ids.has(item.id)) transaction.delete(item.ref);
      });
      records.forEach((record) => transaction.set(doc(db, name, record.id), record));
    });

    const nextRevision = currentRevision + 1;
    transaction.set(settingsRef, {
      revision: nextRevision,
      version: data.version,
      lastUpdated: new Date().toISOString(),
      categories: data.categories,
      teamMembers: data.teamMembers,
      updatedAt: serverTimestamp(),
    });
    return nextRevision;
  });
}

export async function loadOrSeedCloudData(localData: AppData): Promise<LoadedCloudData> {
  const remote = await loadCloudData();
  if (remote.data) return remote;
  try {
    const revision = await saveCloudData(localData, remote.revision);
    return { data: localData, revision };
  } catch (error) {
    const latest = await loadCloudData();
    if (latest.data) return latest;
    throw error;
  }
}

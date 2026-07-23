import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  writeBatch 
} from "firebase/firestore";
import { db } from "../lib/firebase";

export interface SorteoItem {
  loteria: string;
  fecha: string;
  scrapedSource: string;
  draws: Record<string, string | null>;
  scrapedHours?: Record<string, boolean>;
  count: number;
  extractedAt: string;
}

/**
 * Servicio para persistir y sincronizar sorteos en Firestore
 */
export class FirebaseService {
  /**
   * Guarda un sorteo específico en Firestore.
   * Usamos `${loteria}_${fecha}` como ID único para evitar duplicados.
   */
  static async saveSorteo(item: SorteoItem): Promise<void> {
    if (!item.loteria || !item.fecha) return;
    const docId = `${item.loteria}_${item.fecha}`;
    const docRef = doc(db, "sorteos", docId);
    
    await setDoc(docRef, {
      loteria: item.loteria,
      fecha: item.fecha,
      scrapedSource: item.scrapedSource || "Manual",
      draws: item.draws || {},
      scrapedHours: item.scrapedHours || {},
      count: item.count || 0,
      extractedAt: item.extractedAt || new Date().toLocaleTimeString("es-VE", { hour12: false }),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  /**
   * Obtiene todos los sorteos del historial desde Firestore
   */
  static async getAllSorteos(): Promise<SorteoItem[]> {
    const collRef = collection(db, "sorteos");
    const q = query(collRef);
    const querySnapshot = await getDocs(q);
    const results: SorteoItem[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        loteria: data.loteria,
        fecha: data.fecha,
        scrapedSource: data.scrapedSource,
        draws: data.draws,
        scrapedHours: data.scrapedHours,
        count: data.count,
        extractedAt: data.extractedAt
      });
    });

    return results.sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  /**
   * Sincroniza la colección de sorteos en tiempo real y actualiza un callback
   */
  static listenToSorteos(onUpdate: (items: SorteoItem[]) => void): () => void {
    const collRef = collection(db, "sorteos");
    return onSnapshot(collRef, (snapshot) => {
      const results: SorteoItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        results.push({
          loteria: data.loteria,
          fecha: data.fecha,
          scrapedSource: data.scrapedSource,
          draws: data.draws,
          scrapedHours: data.scrapedHours,
          count: data.count,
          extractedAt: data.extractedAt
        });
      });
      const sorted = results.sort((a, b) => a.fecha.localeCompare(b.fecha));
      onUpdate(sorted);
    }, (error) => {
      console.error("Error en escucha en tiempo real de Firestore:", error);
    });
  }

  /**
   * Migra un lote de sorteos desde LocalStorage a Firestore
   */
  static async migrateLocalToFirestore(localItems: SorteoItem[]): Promise<{ migratedCount: number }> {
    if (!localItems || localItems.length === 0) return { migratedCount: 0 };

    const batch = writeBatch(db);
    let count = 0;

    // Para evitar límites de transacciones de Firestore (max 500 escrituras por lote)
    // procesamos los primeros 450 elementos.
    const itemsToMigrate = localItems.slice(0, 450);

    itemsToMigrate.forEach((item) => {
      const docId = `${item.loteria}_${item.fecha}`;
      const docRef = doc(db, "sorteos", docId);
      
      batch.set(docRef, {
        loteria: item.loteria,
        fecha: item.fecha,
        scrapedSource: item.scrapedSource || "Migración",
        draws: item.draws || {},
        scrapedHours: item.scrapedHours || {},
        count: item.count || 0,
        extractedAt: item.extractedAt || new Date().toLocaleTimeString("es-VE", { hour12: false }),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      count++;
    });

    await batch.commit();
    return { migratedCount: count };
  }
}

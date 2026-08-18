import { doc, getDoc, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type PrecompilazioneDati = {
  nome: string | null;
  cognome: string | null;
  ragioneSociale: string | null;
  partitaIva: string | null;
  tipoAcquirente: string | null; // "privato" | "azienda"
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  email: string | null;
  telefono: string | null;
  modello: string | null;
  codiceModello: string | null;
  matricola: string | null;
  batteriaMatricola: string | null;
  dataAcquisto: string | null;
  numeroOrdine: string | null;
};

/** Legge precompilazioni/{id} (get pubblico, get-only). Ritorna null sia se il
 *  doc non esiste sia se è scaduto: per il chiamante è un unico caso "niente
 *  da precompilare", nessuna distinzione visibile all'utente. */
export async function leggiPrecompilazione(id: string): Promise<PrecompilazioneDati | null> {
  const snap = await getDoc(doc(db, "precompilazioni", id));
  if (!snap.exists()) return null;

  const d = snap.data();
  const scadenza = (d.scadenza as Timestamp | undefined)?.toDate?.();
  if (scadenza && scadenza.getTime() <= Date.now()) return null;

  return {
    nome: d.nome ?? null,
    cognome: d.cognome ?? null,
    ragioneSociale: d.ragioneSociale ?? null,
    partitaIva: d.partitaIva ?? null,
    tipoAcquirente: d.tipoAcquirente ?? null,
    indirizzo: d.indirizzo ?? null,
    cap: d.cap ?? null,
    citta: d.citta ?? null,
    provincia: d.provincia ?? null,
    email: d.email ?? null,
    telefono: d.telefono ?? null,
    modello: d.modello ?? null,
    codiceModello: d.codiceModello ?? null,
    matricola: d.matricola ?? null,
    batteriaMatricola: d.batteriaMatricola ?? null,
    dataAcquisto: d.dataAcquisto ?? null,
    numeroOrdine: d.numeroOrdine ?? null,
  };
}

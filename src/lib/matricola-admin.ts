/**
 * Solo server (usa firebase-admin): non importare da componenti client.
 * Verifica se una matricola risulta già registrata, senza esporre i dati
 * del registrante — nessuna lettura pubblica su registrazioni_garanzia.
 */
import { getAdminDb } from "@/lib/firebase-admin";

export async function matricolaGiaRegistrata(matricola: string): Promise<boolean> {
  const snap = await getAdminDb().collection("registrazioni_garanzia").doc(matricola).get();
  return snap.exists;
}

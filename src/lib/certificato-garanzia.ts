/**
 * Certificato di Garanzia — dati e codice univoco.
 * Il layout vive in public/templates/certificato-garanzia/template.html:
 * qui c'è solo la logica che prepara i dati da iniettare nei placeholder.
 * Adattato da gestionale-next/lib/certificato-garanzia.ts: lì la fonte era
 * una vendita + riga carrello, qui è un documento registrazioni_garanzia
 * (un cliente = un carrello + una batteria, niente righe multiple).
 */

import { collection, getDocs, query, where, type Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { tipoDaMatricola } from "@/lib/batterie";

// Alfabeto senza caratteri ambigui (niente 0/O, 1/I/L) — stesso schema del gestionale.
const ALFABETO_CODICE = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

function randomCode(len: number): string {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALFABETO_CODICE[b % ALFABETO_CODICE.length]).join("");
}

/** Genera un codice VG-CERT-<anno>-<6 caratteri>, verificato univoco su registrazioni_garanzia. */
export async function generaCodiceCertificatoUnivoco(): Promise<string> {
  const year = new Date().getFullYear();
  for (let tentativo = 0; tentativo < 5; tentativo++) {
    const candidato = `VG-CERT-${year}-${randomCode(6)}`;
    const snap = await getDocs(
      query(collection(db, "registrazioni_garanzia"), where("certificatoCodice", "==", candidato))
    );
    if (snap.empty) return candidato;
  }
  throw new Error("Impossibile generare un codice certificato univoco, riprova.");
}

export type DatiCertificato = {
  intestatario: string;
  dataAcquisto: string;
  meseDecorrenza: string;
  modelloCarrello: string;
  matricolaCarrello: string;
  tipoBatteria: string;
  matricolaBatteria: string;
  numDocumento: string;
  codiceCertificato: string;
  durata: string;
};

/** Sottoinsieme di registrazioni_garanzia usato per compilare il certificato. */
export type RegistrazioneGaranzia = {
  nome?: string;
  cognome?: string;
  modello?: string;
  matricola: string;
  batteriaMatricola?: string;
  dataAcquisto?: string;
  dataInizioGaranzia?: Timestamp | null;
  anniGaranzia?: number;
  numeroOrdine?: string | null;
};

const MESI_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function formattaData(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T12:00:00");
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("it-IT");
}

function formattaMeseAnno(d: Date): string {
  return `${MESI_IT[d.getMonth()]} ${d.getFullYear()}`;
}

function formattaDurata(anni?: number): string {
  if (!anni) return "—";
  return anni === 1 ? "1 anno" : `${anni} anni`;
}

/** Mappa una registrazione nei campi del certificato. Nessun dato digitato a mano. */
export function datiCertificato(
  reg: RegistrazioneGaranzia,
  codiceCertificato: string
): DatiCertificato {
  // La decorrenza garanzia preferisce dataInizioGaranzia (Timestamp calcolato
  // al salvataggio); se assente ripiega sulla data di acquisto grezza.
  const inizioDecorrenza = reg.dataInizioGaranzia
    ? reg.dataInizioGaranzia.toDate()
    : reg.dataAcquisto
    ? new Date(reg.dataAcquisto + "T12:00:00")
    : null;

  // Il tipo (Wh) non è un campo a sé nel form: si ricava dal prefisso della
  // matricola batteria, stessa logica del gestionale (lib/batterie.ts) —
  // così la stessa matricola dà lo stesso tipo su entrambi i sistemi.
  const tipo = tipoDaMatricola(reg.batteriaMatricola || "");

  return {
    intestatario: `${reg.nome || ""} ${reg.cognome || ""}`.trim() || "—",
    dataAcquisto: formattaData(reg.dataAcquisto),
    meseDecorrenza:
      inizioDecorrenza && !Number.isNaN(inizioDecorrenza.getTime())
        ? formattaMeseAnno(inizioDecorrenza)
        : "—",
    modelloCarrello: reg.modello || "—",
    matricolaCarrello: reg.matricola || "—",
    tipoBatteria: tipo ? `${tipo}Wh` : "—",
    matricolaBatteria: reg.batteriaMatricola || "—",
    // Il numero ordine è opzionale e spesso assente: ripiega sulla matricola
    // carrello come riferimento sempre disponibile.
    numDocumento: reg.numeroOrdine || reg.matricola || "—",
    codiceCertificato,
    durata: formattaDurata(reg.anniGaranzia),
  };
}

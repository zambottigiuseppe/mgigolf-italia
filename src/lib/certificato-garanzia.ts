/**
 * Certificato di Garanzia — dati e codice univoco.
 * Il layout vive in public/templates/certificato-garanzia/template.html:
 * qui c'è solo la logica che prepara i dati da iniettare nei placeholder.
 * Adattato da gestionale-next/lib/certificato-garanzia.ts: lì la fonte era
 * una vendita + riga carrello, qui è un documento registrazioni_garanzia
 * (un cliente = un carrello + una batteria, niente righe multiple).
 */

import type { Timestamp } from "firebase/firestore";
import { tipoDaMatricola } from "@/lib/batterie";

// Alfabeto senza caratteri ambigui (niente 0/O, 1/I/L) — stesso schema del gestionale.
const ALFABETO_CODICE = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * Genera un codice VG-CERT-<anno>-<6 caratteri>, derivato deterministicamente
 * dalla matricola (hash SHA-256, primi 6 byte mappati sull'alfabeto sopra).
 * Nessuna lettura Firestore: l'unicità è ereditata da quella della matricola
 * stessa, già garantita da Firestore (è l'ID del documento, e la regola
 * "allow update: if false" impedisce di registrarne due con lo stesso ID) —
 * stessa matricola = stesso codice, matricole diverse = codici diversi con
 * probabilità di collisione trascurabile (31^6 combinazioni possibili).
 */
export async function generaCodiceCertificatoUnivoco(matricola: string): Promise<string> {
  const anno = new Date().getFullYear();
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(matricola));
  const hashBytes = new Uint8Array(hashBuffer);
  let suffisso = "";
  for (let i = 0; i < 6; i++) {
    suffisso += ALFABETO_CODICE[hashBytes[i] % ALFABETO_CODICE.length];
  }
  return `VG-CERT-${anno}-${suffisso}`;
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

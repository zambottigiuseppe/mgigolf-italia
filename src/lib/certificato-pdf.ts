/**
 * Certificato di Garanzia — rendering PDF.
 * Carica il template HTML da public/templates/certificato-garanzia/template.html,
 * sostituisce i placeholder {{...}} coi dati reali e rasterizza in un PDF A4.
 * Solo browser: usa document/canvas, va chiamato da un componente "use client".
 * Porting identico da gestionale-next/lib/certificato-pdf.ts, incluso
 * l'accorgimento che tiene il PDF leggero (scala 2x + JPEG qualità 0.9
 * invece di PNG: lì ha risolto un PDF che arrivava a 26MB).
 */

import QRCode from "qrcode";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import type { DatiCertificato } from "@/lib/certificato-garanzia";

const TEMPLATE_URL = "/templates/certificato-garanzia/template.html";

// Pagina di verifica/registrazione garanzia. Placeholder finché non esiste
// una vera pagina "Verifica la tua garanzia" per matricola.
export const URL_ATTIVAZIONE_GARANZIA = "https://mgigolfitalia.it/registrazione";

let templateCache: string | null = null;

async function caricaTemplate(): Promise<string> {
  if (templateCache) return templateCache;
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) throw new Error("Template certificato non trovato");
  templateCache = await res.text();
  return templateCache;
}

function sostituisciPlaceholder(html: string, dati: Record<string, string>): string {
  let out = html;
  for (const [key, value] of Object.entries(dati)) {
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

/** Genera il PDF del certificato e avvia il download nel browser. */
export async function generaCertificatoPdf(dati: DatiCertificato): Promise<void> {
  const [templateHtml, qrDataUrl] = await Promise.all([
    caricaTemplate(),
    QRCode.toDataURL(URL_ATTIVAZIONE_GARANZIA, { width: 300, margin: 1 }),
  ]);

  const html = sostituisciPlaceholder(templateHtml, {
    INTESTATARIO: dati.intestatario,
    DATA_ACQUISTO: dati.dataAcquisto,
    MESE_DECORRENZA: dati.meseDecorrenza,
    MODELLO_CARRELLO: dati.modelloCarrello,
    MATRICOLA_CARRELLO: dati.matricolaCarrello,
    TIPO_BATTERIA: dati.tipoBatteria,
    MATRICOLA_BATTERIA: dati.matricolaBatteria,
    NUM_DOCUMENTO: dati.numDocumento,
    CODICE_CERTIFICATO: dati.codiceCertificato,
    DURATA: dati.durata,
    QR_SRC: qrDataUrl,
  });

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "-99999px";
  container.style.zIndex = "-1";
  document.body.appendChild(container);

  const iframe = document.createElement("iframe");
  iframe.style.width = "210mm";
  iframe.style.height = "297mm";
  iframe.style.border = "0";
  container.appendChild(iframe);

  try {
    await new Promise<void>((resolve, reject) => {
      const idoc = iframe.contentDocument;
      if (!idoc) {
        reject(new Error("Impossibile accedere al documento certificato"));
        return;
      }
      iframe.onload = () => resolve();
      idoc.open();
      idoc.write(html);
      idoc.close();
    });

    const idoc = iframe.contentDocument!;
    const iwin = iframe.contentWindow as (Window & typeof globalThis) | null;
    if (iwin?.document?.fonts?.ready) {
      await iwin.document.fonts.ready;
    }
    // Margine di sicurezza per il rendering finale dei web font.
    await new Promise((r) => setTimeout(r, 150));

    const foglio = idoc.querySelector(".foglio") as HTMLElement | null;
    if (!foglio) throw new Error("Template certificato non valido: elemento .foglio mancante");

    const canvas = await html2canvas(foglio, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    pdf.addImage(canvas.toDataURL("image/jpeg", 0.9), "JPEG", 0, 0, 210, 297);
    pdf.save(`Certificato-Garanzia-${dati.codiceCertificato}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

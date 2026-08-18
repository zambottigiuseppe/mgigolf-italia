/**
 * Certificato di Garanzia — rendering PDF vettoriale con pdf-lib.
 * Sostituisce il vecchio rendering html2canvas+jsPDF (rasterizzava l'intera
 * pagina in un JPEG, degradando la qualità del testo). Qui testo e forme
 * sono disegnati nativamente: nitidi a qualsiasi zoom/stampa, file leggero
 * (i font vengono sottoinsiemati da pdf-lib: solo i glifi usati finiscono
 * nel PDF). Unico elemento raster: il timbro circolare (testo su percorso
 * curvo, non riproducibile nativamente da pdf-lib), pre-renderizzato una
 * sola volta ad alta risoluzione — vedi public/templates/certificato-garanzia/assets/.
 */

import { PDFDocument, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import type { DatiCertificato } from "@/lib/certificato-garanzia";

const ASSETS = "/templates/certificato-garanzia/assets";

// Pagina di verifica/registrazione garanzia.
export const URL_ATTIVAZIONE_GARANZIA = "https://mgigolfitalia.it/registrazione";

// Palette identica al template HTML originale.
const VERDE = rgb(19 / 255, 95 / 255, 63 / 255);
const ORO = rgb(184 / 255, 151 / 255, 74 / 255);
const INCHIOSTRO = rgb(29 / 255, 36 / 255, 31 / 255);
const GRIGIO = rgb(138 / 255, 142 / 255, 135 / 255);
const LINEA = rgb(236 / 255, 236 / 255, 236 / 255);
const FOOTER_GRIGIO = rgb(143 / 255, 140 / 255, 126 / 255);
const BIANCO = rgb(1, 1, 1);

const mm = (n: number) => (n * 72) / 25.4;

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Asset certificato non trovato: ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

/**
 * pdf-lib registra una nuova voce nel dizionario /Font della pagina ad ogni
 * drawText({font}) — e alla fine di quella chiamata RIPRISTINA il font
 * precedentemente attivo sulla pagina (è pensato come override "usa e getta",
 * non persistente). drawTracked ne fa uno per carattere: su un intero
 * certificato questo gonfia il dizionario risorse con centinaia di voci
 * ridondanti verso gli stessi 5 font. Il fix corretto è chiamare
 * page.setFont() esplicitamente solo quando il font cambia davvero, e non
 * passare mai `font` dentro le options di drawText: così drawText riusa il
 * font "corrente" della pagina invece di re-registrarlo ogni volta.
 */
function creaDisegnaTesto(page: PDFPage) {
  let fontAttivo: PDFFont | null = null;
  return (text: string, x: number, y: number, size: number, font: PDFFont, color: ReturnType<typeof rgb>) => {
    if (font !== fontAttivo) {
      page.setFont(font);
      fontAttivo = font;
    }
    page.drawText(text, { x, y, size, color });
  };
}

/** Testo con tracking (letter-spacing) manuale: pdf-lib non lo supporta nativamente. */
function drawTracked(
  disegnaTesto: ReturnType<typeof creaDisegnaTesto>,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color = INCHIOSTRO,
  trackingPt = 0
) {
  let cx = x;
  for (const ch of text) {
    disegnaTesto(ch, cx, y, size, font, color);
    cx += font.widthOfTextAtSize(ch, size) + trackingPt;
  }
  return cx;
}

function trackedWidth(text: string, size: number, font: PDFFont, trackingPt = 0): number {
  let w = 0;
  for (const ch of text) w += font.widthOfTextAtSize(ch, size) + trackingPt;
  return w - trackingPt;
}

/** Va a capo semplice: spezza su spazi finché il pezzo entra in maxWidth. */
function wrapText(text: string, maxWidth: number, size: number, font: PDFFont): string[] {
  const words = text.split(" ");
  const righe: string[] = [];
  let corrente = "";
  for (const w of words) {
    const prova = corrente ? `${corrente} ${w}` : w;
    if (font.widthOfTextAtSize(prova, size) > maxWidth && corrente) {
      righe.push(corrente);
      corrente = w;
    } else {
      corrente = prova;
    }
  }
  if (corrente) righe.push(corrente);
  return righe;
}

/** Genera il PDF del certificato e avvia il download nel browser. */
export async function generaCertificatoPdf(dati: DatiCertificato): Promise<void> {
  const [
    logoVgBytes,
    logoMgiBytes,
    timbroBytes,
    fontRegularBytes,
    fontMediumBytes,
    fontSemiBoldBytes,
    fontBoldBytes,
    fontItalicBytes,
    qrPngBytes,
  ] = await Promise.all([
    fetchBytes(`${ASSETS}/logo-vertical-golf.png`),
    fetchBytes(`${ASSETS}/logo-mgi.png`),
    fetchBytes(`${ASSETS}/timbro.png`),
    fetchBytes(`${ASSETS}/fonts/Montserrat-Regular.ttf`),
    fetchBytes(`${ASSETS}/fonts/Montserrat-Medium.ttf`),
    fetchBytes(`${ASSETS}/fonts/Montserrat-SemiBold.ttf`),
    fetchBytes(`${ASSETS}/fonts/Montserrat-Bold.ttf`),
    fetchBytes(`${ASSETS}/fonts/Montserrat-MediumItalic.ttf`),
    QRCode.toBuffer(URL_ATTIVAZIONE_GARANZIA, { type: "png", width: 300, margin: 1 }),
  ]);

  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const [regular, medium, semiBold, bold, italic] = await Promise.all([
    pdfDoc.embedFont(fontRegularBytes, { subset: true }),
    pdfDoc.embedFont(fontMediumBytes, { subset: true }),
    pdfDoc.embedFont(fontSemiBoldBytes, { subset: true }),
    pdfDoc.embedFont(fontBoldBytes, { subset: true }),
    pdfDoc.embedFont(fontItalicBytes, { subset: true }),
  ]);

  const [logoVg, logoMgi, timbro, qrImage] = await Promise.all([
    pdfDoc.embedPng(logoVgBytes),
    pdfDoc.embedPng(logoMgiBytes),
    pdfDoc.embedPng(timbroBytes),
    pdfDoc.embedPng(qrPngBytes),
  ]);

  const pageW = mm(210);
  const pageH = mm(297);
  const left = mm(24);
  const right = pageW - mm(24);
  const contentW = right - left;
  const page = pdfDoc.addPage([pageW, pageH]);
  const disegnaTesto = creaDisegnaTesto(page);

  // Barra superiore: non è un vero gradiente CSS, è uno split netto 60/40 verde/oro.
  const barH = mm(1.8);
  page.drawRectangle({ x: 0, y: pageH - barH, width: pageW * 0.6, height: barH, color: VERDE });
  page.drawRectangle({
    x: pageW * 0.6,
    y: pageH - barH,
    width: pageW * 0.4,
    height: barH,
    color: ORO,
  });

  let y = pageH - mm(26);

  // Loghi: Vertical Golf a sinistra (17mm), MGI a destra (13mm), centrati sulla stessa riga.
  const rigaLoghiH = mm(17);
  const vgH = mm(17);
  const vgW = vgH * (logoVg.width / logoVg.height);
  const mgiH = mm(13);
  const mgiW = mgiH * (logoMgi.width / logoMgi.height);
  const yLoghi = y - rigaLoghiH + (rigaLoghiH - vgH) / 2;
  page.drawImage(logoVg, { x: left, y: yLoghi, width: vgW, height: vgH });
  page.drawImage(logoMgi, {
    x: right - mgiW,
    y: y - rigaLoghiH + (rigaLoghiH - mgiH) / 2,
    width: mgiW,
    height: mgiH,
  });
  y -= rigaLoghiH + mm(12);

  // Titolo
  drawTracked(disegnaTesto, "CERTIFICATO UFFICIALE", left, y, 6.4, semiBold, ORO, 1.9);
  y -= mm(6);
  disegnaTesto("Certificato di Garanzia", left, y - 16, 22, bold, VERDE);
  y -= mm(11);
  disegnaTesto("MGI Golf · Carrelli Elettrici", left, y, 7.5, regular, GRIGIO);
  y -= mm(10);

  // Intro
  const introRighe = wrapText(
    "Con il presente documento Vertical Golf attesta la garanzia ufficiale del prodotto MGI di seguito indicato, intestato al cliente e coperto secondo i termini vigenti.",
    contentW * 0.86,
    8.3,
    regular
  );
  const introColor = rgb(0.33, 0.35, 0.31);
  for (const riga of introRighe) {
    disegnaTesto(riga, left, y, 8.3, regular, introColor);
    y -= mm(4.6);
  }
  y -= mm(6);

  // Tabella dati
  const righeDati: [string, string][] = [
    ["Intestatario", dati.intestatario],
    ["Data di acquisto", dati.dataAcquisto],
    ["Decorrenza garanzia", dati.meseDecorrenza],
    ["Modello carrello", dati.modelloCarrello],
    ["Matricola carrello", dati.matricolaCarrello],
    ["Tipo batteria", dati.tipoBatteria],
    ["Matricola batteria", dati.matricolaBatteria],
    ["N° documento di vendita", dati.numDocumento],
  ];
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.75, color: LINEA });
  for (const [k, v] of righeDati) {
    y -= mm(7.2);
    drawTracked(disegnaTesto, k.toUpperCase(), left, y, 6.7, medium, GRIGIO, 0.7);
    disegnaTesto(v || "—", left + contentW * 0.46, y, 9.5, semiBold, INCHIOSTRO);
    page.drawLine({
      start: { x: left, y: y - mm(2.6) },
      end: { x: right, y: y - mm(2.6) },
      thickness: 0.5,
      color: LINEA,
    });
  }
  y -= mm(9);

  // Codice certificato
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: LINEA });
  y -= mm(5.5);
  drawTracked(disegnaTesto, "CODICE CERTIFICATO", left, y, 6.2, medium, GRIGIO, 1.1);
  const codVal = dati.codiceCertificato;
  const codW = trackedWidth(codVal, 10, bold, 0.4);
  drawTracked(disegnaTesto, codVal, right - codW, y - 1, 10, bold, VERDE, 0.4);
  y -= mm(4.5);
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: LINEA });
  y -= mm(9);

  // Box durata (verde) + box QR, affiancati
  const boxH = mm(24);
  const qrBoxW = mm(42);
  const gap = mm(6);
  const durataW = contentW - qrBoxW - gap;

  page.drawRectangle({ x: left, y: y - boxH, width: durataW, height: boxH, color: VERDE });
  const bianco = rgb(1, 1, 1);
  drawTracked(disegnaTesto, "DURATA DELLA GARANZIA", left + mm(7), y - mm(8), 6.5, medium, bianco, 1.4);
  disegnaTesto(dati.durata, left + mm(7), y - mm(18), 19, bold, bianco);

  const qrBoxX = left + durataW + gap;
  page.drawRectangle({
    x: qrBoxX,
    y: y - boxH,
    width: qrBoxW,
    height: boxH,
    borderColor: LINEA,
    borderWidth: 0.75,
    color: BIANCO,
  });
  const qrSize = mm(15.5);
  page.drawImage(qrImage, {
    x: qrBoxX + (qrBoxW - qrSize) / 2,
    y: y - mm(4) - qrSize,
    width: qrSize,
    height: qrSize,
  });
  const qrCap1 = "Registra";
  const qrCap2 = "la garanzia";
  disegnaTesto(
    qrCap1,
    qrBoxX + (qrBoxW - medium.widthOfTextAtSize(qrCap1, 5.6)) / 2,
    y - boxH + mm(4.3),
    5.6,
    medium,
    GRIGIO
  );
  disegnaTesto(
    qrCap2,
    qrBoxX + (qrBoxW - medium.widthOfTextAtSize(qrCap2, 5.6)) / 2,
    y - boxH + mm(1.7),
    5.6,
    medium,
    GRIGIO
  );
  y -= boxH + mm(9);

  // Paragrafo di ringraziamento (corsivo)
  const grazieRighe = wrapText(
    "Grazie per aver scelto un prodotto MGI e per aver riposto la tua fiducia in Vertical Golf.",
    contentW * 0.86,
    9,
    italic
  );
  const grazieRighe2 = wrapText("Ti auguriamo tante splendide giornate sul green, in tutta libertà.", contentW * 0.86, 9, italic);
  for (const riga of [...grazieRighe, ...grazieRighe2]) {
    disegnaTesto(riga, left, y, 9, italic, VERDE);
    y -= mm(5.2);
  }

  // Validazione: riga firma + timbro. Segue il flusso (margin-top 16mm come nel
  // template originale) invece di una posizione fissa, per non sovrapporsi mai
  // al paragrafo sopra qualunque sia la sua lunghezza.
  y -= mm(16);
  const yValidazione = y;
  const firmaW = contentW * 0.42;
  page.drawLine({
    start: { x: left, y: yValidazione },
    end: { x: left + firmaW, y: yValidazione },
    thickness: 0.75,
    color: rgb(0.725, 0.714, 0.675),
  });
  drawTracked(disegnaTesto, "LUOGO E DATA", left, yValidazione - mm(4), 6.2, medium, GRIGIO, 1);

  const timbroSize = mm(26);
  page.drawImage(timbro, {
    x: right - timbroSize,
    y: yValidazione + mm(9),
    width: timbroSize,
    height: timbroSize,
    opacity: 0.9,
    rotate: degrees(-11),
  });
  page.drawLine({
    start: { x: right - firmaW, y: yValidazione },
    end: { x: right, y: yValidazione },
    thickness: 0.75,
    color: rgb(0.725, 0.714, 0.675),
  });
  const firmaCap = "VERTICAL GOLF — TIMBRO E FIRMA";
  drawTracked(
    disegnaTesto,
    firmaCap,
    right - trackedWidth(firmaCap, 6.2, medium, 1),
    yValidazione - mm(4),
    6.2,
    medium,
    GRIGIO,
    1
  );

  // Footer
  const footerY = mm(13);
  page.drawLine({ start: { x: left, y: footerY + mm(3) }, end: { x: right, y: footerY + mm(3) }, thickness: 0.5, color: LINEA });
  disegnaTesto("VERTICAL GOLF", left, footerY, 6.5, bold, VERDE);
  const vgW2 = bold.widthOfTextAtSize("VERTICAL GOLF", 6.5);
  disegnaTesto(
    " — Vertical Solution S.r.l. · Via Padania 27, 25038 Rovato (BS)",
    left + vgW2,
    footerY,
    6.5,
    regular,
    FOOTER_GRIGIO
  );
  disegnaTesto(
    "Tel. +39 030 5528505 · support@verticalgolf.it · verticalgolf.it",
    left,
    footerY - mm(3.2),
    6.5,
    regular,
    FOOTER_GRIGIO
  );

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Certificato-Garanzia-${dati.codiceCertificato}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

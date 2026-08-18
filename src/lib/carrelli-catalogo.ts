export type CarrelloCatalogo = {
  codice: string;
  descrizione: string;
};

// Paracadute, non fonte di verità: usato SOLO se l'endpoint del gestionale
// non risponde (rete giù, deploy in corso, ecc.). Snapshot dei 16 carrelli
// letto da https://distribuzione.verticalgolf.it/api/public/carrelli il
// 2026-08-18 — può andare stale se il catalogo cambia, ma il menu non deve
// mai restare vuoto.
export const FALLBACK_CARRELLI: CarrelloCatalogo[] = [
  { codice: "AI500-B", descrizione: "Ai 500 Black 250Wh Li BAT" },
  { codice: "AINAV-G-B", descrizione: "Ai NavigATor GPS+ Black 380Wh Li BAT (Discontinued)" },
  { codice: "AINAV-G-MN", descrizione: "Ai Nav GPS+ Matte Navy Black (Ltd Edt)" },
  { codice: "AINAV-H-B", descrizione: "Ai Navigator Halo Black (NEW)" },
  { codice: "EBOOST-B", descrizione: "E-Boost Matte Black (NEW)" },
  { codice: "EBOOST-N", descrizione: "E-Boost Matte Navy (NEW)" },
  { codice: "EBOOST-W", descrizione: "E-Boost Matte White (NEW)" },
  { codice: "RZIPX1-BLACK", descrizione: "Refreshed Zip X1 Matte Black/Gloss 250Wh Li BAT" },
  { codice: "RZIPX1-BLACK-BUP", descrizione: "Refreshed Zip X1 Matte Black/Gloss BUP 299Wh Li BAT" },
  { codice: "RZIPX3-BLACK", descrizione: "Refreshed Zip X3 Matte Black/Gloss 250Wh Li BAT" },
  { codice: "RZIPX3-BLACK-BUP", descrizione: "Refreshed Zip X3 Matte Black/Gloss BUP 299Wh Li BAT" },
  { codice: "RZIPX5-BLACK", descrizione: "Refreshed Zip X5 Matte Black/Gloss 250Wh Li BAT" },
  { codice: "RZIPX5-BLACK-BUP", descrizione: "Refreshed Zip X5 Matte Black/Gloss BUP 299Wh Li BAT" },
  { codice: "RZIPXN-AMN", descrizione: "Zip Nav AT MatteNavy Gloss Blk (Ltd Edt)" },
  { codice: "RZIPXN-ATB", descrizione: "Refreshed Zip Nav AT Matte Black/Gloss 299Wh Li BAT" },
  { codice: "RZIPXN-B", descrizione: "Refreshed Zip Nav Matte Black/Gloss 299Wh Li BAT" },
];

/** Legge il catalogo carrelli dal gestionale (server-side). Timeout breve e
 *  fallback statico: la pagina di registrazione non deve mai restare senza
 *  modelli nel menu, anche se il gestionale è irraggiungibile. */
export async function fetchCarrelli(): Promise<CarrelloCatalogo[]> {
  const baseUrl = process.env.GESTIONALE_API_URL;
  if (!baseUrl) {
    console.error("GESTIONALE_API_URL non configurata: uso il fallback statico dei carrelli.");
    return FALLBACK_CARRELLI;
  }

  try {
    const res = await fetch(`${baseUrl}/api/public/carrelli`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();
    const carrelli = Array.isArray(data?.carrelli) ? data.carrelli : [];
    if (carrelli.length === 0) throw new Error("Risposta senza carrelli");

    return carrelli;
  } catch (e) {
    console.error("Impossibile leggere il catalogo carrelli dal gestionale, uso il fallback:", e);
    return FALLBACK_CARRELLI;
  }
}

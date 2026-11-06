import { NextResponse } from "next/server";

// Inoltra al gestionale la matricola appena registrata, perché attivi la garanzia del
// carrello venduto a un rivenditore (gestionale: app/api/public/attiva-garanzia).
// La verifica che la registrazione esista la fa il gestionale, lato server: qui
// passa solo la matricola. Chiamata non bloccante dal form, dopo il salvataggio:
// qualunque errore resta nei log e la registrazione è comunque già salvata — dal
// gestionale c'è il pulsante "Attiva garanzia" come riserva.
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const matricola = String(body?.matricola || "").trim().toUpperCase();
  if (!matricola || matricola.length > 100 || matricola.includes("/")) {
    return NextResponse.json({ error: "Matricola non valida" }, { status: 400 });
  }

  const baseUrl = process.env.GESTIONALE_API_URL;
  if (!baseUrl) {
    console.error("GESTIONALE_API_URL non configurata: garanzia non attivata per", matricola);
    return NextResponse.json({ ok: false, error: "Gestionale non configurato" }, { status: 503 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/public/attiva-garanzia`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricola }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    const esito = await res.json().catch(() => ({}));
    if (!res.ok) console.error("Attivazione garanzia non riuscita per", matricola, res.status, esito);
    return NextResponse.json({ ok: res.ok, esito: esito?.esito ?? null }, { status: res.ok ? 200 : 502 });
  } catch (e) {
    console.error("Gestionale non raggiungibile, garanzia non attivata per", matricola, e);
    return NextResponse.json({ ok: false, error: "Gestionale non raggiungibile" }, { status: 502 });
  }
}

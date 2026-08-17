import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getAdminDb } from "@/lib/firebase-admin";

// Mittente: il dominio DEVE essere verificato nel pannello Resend,
// altrimenti l'invio viene rifiutato.
const MITTENTE = "MGI Golf Italia <garanzie@verticalgolf.it>";
// Copia interna all'assistenza.
const DESTINATARIO_INTERNO =
  process.env.EMAIL_ASSISTENZA || "support@verticalgolf.it";
// Finestra entro cui una registrazione può generare l'email:
// impedisce di ri-scatenare invii su registrazioni vecchie.
const FINESTRA_MINUTI = 10;
// firebase-admin richiede il runtime Node, non Edge.
export const runtime = "nodejs";

function formattaData(valore: unknown): string {
  try {
    // I Timestamp Firestore lato Admin hanno il metodo toDate().
    const d =
      valore && typeof (valore as { toDate?: () => Date }).toDate === "function"
        ? (valore as { toDate: () => Date }).toDate()
        : new Date(String(valore));
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const matricola = String(body?.matricola || "").trim().toUpperCase();

    if (!matricola || matricola.length > 100 || matricola.includes("/")) {
      return NextResponse.json({ error: "Matricola non valida" }, { status: 400 });
    }

    const adminDb = getAdminDb();
    const snap = await adminDb
      .collection("registrazioni_garanzia")
      .doc(matricola)
      .get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Registrazione non trovata" }, { status: 404 });
    }

    const d = snap.data() as Record<string, unknown>;

    // Solo registrazioni appena create: evita che l'endpoint venga usato
    // per rispedire email su pratiche vecchie.
    const creato = (d.createdAt as { toDate?: () => Date })?.toDate?.();
    if (creato) {
      const minutiFa = (Date.now() - creato.getTime()) / 60000;
      if (minutiFa > FINESTRA_MINUTI) {
        return NextResponse.json({ error: "Registrazione non recente" }, { status: 409 });
      }
    }

    // Evita invii doppi se la pagina viene ricaricata.
    if (d.emailInviata === true) {
      return NextResponse.json({ ok: true, giaInviata: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const nomeCompleto = `${d.nome ?? ""} ${d.cognome ?? ""}`.trim();
    const anni = Number(d.anniGaranzia ?? 2);
    const durata = anni === 1 ? "1 anno" : `${anni} anni`;
    const dataAcq = formattaData(d.dataInizioGaranzia ?? d.dataAcquisto);
    const dataScad = formattaData(d.dataScadenzaGaranzia);
    const emailCliente = String(d.email ?? "");

    // ---------- Email al cliente ----------
    const htmlCliente = `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1f2937">
  <div style="background:#1A4731;padding:24px">
    <div style="color:#C9A84C;font-size:11px;letter-spacing:2px;margin-bottom:4px">MGI GOLF ITALIA</div>
    <div style="color:#ffffff;font-size:18px;font-weight:600">Garanzia registrata</div>
  </div>
  <div style="padding:28px 24px">
    <p style="margin:0 0 16px">Gentile ${nomeCompleto},</p>
    <p style="margin:0 0 20px;line-height:1.6">
      la registrazione della garanzia del suo carrello MGI è stata completata.
      Di seguito il riepilogo dei dati registrati.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#6b7280">Modello</td><td style="padding:8px 0;text-align:right;font-weight:600">${d.modello ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb">Numero di serie</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #e5e7eb">${matricola}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb">Data di acquisto</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #e5e7eb">${dataAcq}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb">Durata garanzia</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #e5e7eb">${durata}</td></tr>
      <tr><td style="padding:8px 0;color:#6b7280;border-top:1px solid #e5e7eb">Scadenza</td><td style="padding:8px 0;text-align:right;font-weight:600;border-top:1px solid #e5e7eb">${dataScad}</td></tr>
    </table>
    <p style="margin:24px 0 8px;line-height:1.6">
      Conservi questa email: il numero di serie è il riferimento della sua garanzia.
      Per qualsiasi necessità di assistenza scriva a
      <a href="mailto:support@verticalgolf.it" style="color:#1A4731">support@verticalgolf.it</a>
      o chiami il +39 030 5528505.
    </p>
    <p style="margin:20px 0 0;font-size:12px;color:#6b7280;line-height:1.6">
      La garanzia convenzionale MGI si aggiunge alla garanzia legale prevista dalla
      normativa italiana e non la limita né la sostituisce. Le raccomandiamo di
      seguire le istruzioni sulla cura delle batterie al litio consultabili su
      mgigolfitalia.it.
    </p>
  </div>
  <div style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280">
    Vertical Solution S.r.l. — Partner ufficiale MGI per l'Italia<br />
    Via Padania 25, 25038 Rovato (BS) — verticalgolf.it
  </div>
</div>`;

    // ---------- Email interna ----------
    const htmlInterno = `
<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;color:#1f2937">
  <h2 style="margin:0 0 16px;font-size:16px">Nuova registrazione garanzia dal sito</h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#6b7280">Cliente</td><td style="padding:6px 0"><strong>${nomeCompleto}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Email</td><td style="padding:6px 0">${emailCliente}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Telefono</td><td style="padding:6px 0">${d.telefono ?? "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Tipo acquirente</td><td style="padding:6px 0">${d.tipoAcquirente ?? "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Ragione sociale</td><td style="padding:6px 0">${d.ragioneSociale ?? "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Partita IVA</td><td style="padding:6px 0">${d.partitaIva ?? "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Modello</td><td style="padding:6px 0">${d.modello ?? "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Matricola</td><td style="padding:6px 0"><strong>${matricola}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Data acquisto</td><td style="padding:6px 0">${dataAcq}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Scadenza</td><td style="padding:6px 0">${dataScad} (${durata})</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Numero ordine</td><td style="padding:6px 0">${d.numeroOrdine ?? "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280">Prova d'acquisto</td><td style="padding:6px 0">${
      d.provaAcquistoUrl
        ? `<a href="${d.provaAcquistoUrl}">apri documento</a>`
        : "non allegata"
    }</td></tr>
  </table>
  <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
    Da verificare: che la matricola corrisponda a un carrello presente nel gestionale.
  </p>
</div>`;

    await resend.emails.send({
      from: MITTENTE,
      to: emailCliente,
      replyTo: "support@verticalgolf.it",
      subject: `Garanzia MGI registrata — matricola ${matricola}`,
      html: htmlCliente,
    });

    await resend.emails.send({
      from: MITTENTE,
      to: DESTINATARIO_INTERNO,
      replyTo: emailCliente,
      subject: `Nuova garanzia MGI — ${d.modello ?? ""} / ${matricola}`,
      html: htmlInterno,
    });

    await snap.ref.update({ emailInviata: true });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Errore invio email garanzia:", err);
    // Non blocchiamo mai il cliente: la registrazione è già salvata.
    return NextResponse.json({ error: "Invio non riuscito" }, { status: 500 });
  }
}

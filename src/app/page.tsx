"use client";

import { useState } from "react";
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { batteryCareSections } from "@/content/battery-care";
import { puntiAssistenza } from "@/content/punti-assistenza";

const MODELLI = [
  "Ai NavigATor GPS+ Black 380Wh Li BAT",
  "Ai Nav GPS+ Matte Navy Black (Ltd Edt)",
  "Ai Navigator Halo Black (NEW)",
  "E-Boost Matte Black (NEW)",
  "E-Boost Matte Navy (NEW)",
  "E-Boost Matte White (NEW)",
  "Zip X1 Matte Black/Gloss 250Wh Li BAT",
  "Zip X1 Matte Black/Gloss BUP 299Wh Li BAT",
  "Zip X3 Matte Black/Gloss 250Wh Li BAT",
  "Zip X3 Matte Black/Gloss BUP 299Wh Li BAT",
  "Zip X5 Matte Black/Gloss 250Wh Li BAT",
  "Zip X5 Matte Black/Gloss BUP 299Wh Li BAT",
  "Zip Nav AT Matte Navy Gloss Blk (Ltd Edt)",
  "Zip Nav ATB Matte Black/Gloss 299Wh Li BAT",
  "Zip Nav Matte Black/Gloss 299Wh Li BAT",
  "Altro"
] as const;

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
const [openRegioni, setOpenRegioni] = useState<Record<string, boolean>>({});


  function toggleSection(id: string) {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  }
function toggleRegione(id: string) {
  setOpenRegioni((prev) => ({ ...prev, [id]: !prev[id] }));
}

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const matricola = (formData.get("matricola") as string).trim().toUpperCase();
    const dataAcquisto = formData.get("dataAcquisto") as string;

    const inizio = new Date();
    const scadenza = new Date();
    scadenza.setFullYear(scadenza.getFullYear() + 2);

    try {
      let provaAcquistoUrl: string | undefined;
      const file = formData.get("provaAcquisto") as File;

      if (file && file.size > 0) {
        const storageRef = ref(storage, `garanzie/${matricola}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        provaAcquistoUrl = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, "registrazioni_garanzia"), {
        nome: formData.get("nome"),
        cognome: formData.get("cognome"),
        email: formData.get("email"),
        telefono: formData.get("telefono"),
        indirizzo: formData.get("indirizzo") || null,
        citta: formData.get("citta") || null,
        cap: formData.get("cap") || null,
        provincia: formData.get("provincia") || null,
        modello: formData.get("modello"),
        matricola,
        dataAcquisto,
        numeroOrdine: formData.get("numeroOrdine") || null,
        provaAcquistoUrl: provaAcquistoUrl || null,
        dataInizioGaranzia: Timestamp.fromDate(inizio),
        dataScadenzaGaranzia: Timestamp.fromDate(scadenza),
        stato: "attiva",
        fonte: "sito",
        privacyAccettata: true,
        batteriaIstruzioniAccettate: true,
        createdAt: serverTimestamp(),
      });

      setSuccess(true);
      form.reset();
    } catch (err) {
      console.error(err);
      setError("Si è verificato un errore. Controlla i dati e riprova.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#f8f9f8] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#1A4731]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Garanzia registrata</h1>
          <p className="text-gray-600 mb-2">
            La tua garanzia ufficiale MGI Italia è attiva per <strong>2 anni</strong>.
          </p>
          <p className="text-sm text-gray-500">
            Riceverai una email di conferma a breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9f8]">
      {/* Header */}
      <header className="bg-[#1A4731] text-white">
        <div className="max-w-3xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <div className="text-xs tracking-widest text-[#C9A84C] font-medium mb-1">MGI GOLF ITALIA</div>
            <h1 className="text-xl font-semibold">Registrazione Garanzia</h1>
          </div>
          <div className="text-right text-sm text-white/70">
            Partner ufficiale<br />per l’Italia
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {/* Intro */}
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">
            Attiva la tua garanzia ufficiale
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Compila il modulo qui sotto per registrare il tuo carrello MGI.  
            La garanzia di 2 anni sarà attiva immediatamente e gestita direttamente in Italia.
          </p>
        </div>

{/* ========== PUNTI ASSISTENZA ========== */}
<section className="mb-12">
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="bg-[#1A4731] px-6 py-4">
      <h3 className="text-white font-semibold text-lg">
        Punti Assistenza Autorizzati
      </h3>
      <p className="text-white/80 text-sm mt-1">
        Clicca sulla regione per vedere i dettagli
      </p>
    </div>

    <div className="divide-y divide-gray-100">
      {puntiAssistenza.map((regione) => (
        <div key={regione.id}>
          <button
            type="button"
            onClick={() => toggleRegione(regione.id)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
          >
            <span className="font-medium text-gray-900">{regione.regione}</span>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${openRegioni[regione.id] ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {openRegioni[regione.id] && (
            <div className="px-6 pb-5 space-y-4">
              {regione.punti.map((punto, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <div className="font-semibold text-gray-900">{punto.nome}</div>
                  <div className="text-sm text-gray-600 mt-1">{punto.citta}</div>
                  {punto.indirizzo && (
                    <div className="text-sm text-gray-600 mt-1">{punto.indirizzo}</div>
                  )}
                  {punto.telefono && (
                    <div className="text-sm text-gray-600 mt-1">
                      Tel: <a href={`tel:${punto.telefono}`} className="text-[#1A4731] hover:underline">{punto.telefono}</a>
                    </div>
                  )}
                  {punto.email && (
                    <div className="text-sm text-gray-600 mt-1">
                      Email: <a href={`mailto:${punto.email}`} className="text-[#1A4731] hover:underline">{punto.email}</a>
                    </div>
                  )}
                  {punto.sito && (
                    <div className="text-sm mt-2">
                      <a href={punto.sito} target="_blank" rel="noopener noreferrer" className="text-[#1A4731] hover:underline font-medium">
                        Visita il sito →
                      </a>
                    </div>
                  )}
                  {punto.note && (
                    <div className="text-xs text-gray-500 mt-2">{punto.note}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
</section>

        {/* ========== BATTERY CARE (modulare) ========== */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-[#1A4731] px-6 py-4">
              <h3 className="text-white font-semibold text-lg">
                Istruzioni importanti – Batterie al litio MGI
              </h3>
              <p className="text-white/80 text-sm mt-1">
                Leggi attentamente prima di registrare la garanzia
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {batteryCareSections.map((section) => (
                <div key={section.id}>
                  <button
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition"
                  >
                    <span className="font-medium text-gray-900">{section.title}</span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${openSections[section.id] ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {openSections[section.id] && (
                    <div className="px-6 pb-5 space-y-3">
                      {section.paragraphs.map((p, i) => (
                        <p key={i} className="text-sm text-gray-600 leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... resto del form identico a prima ... */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                <input name="nome" required className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Cognome *</label>
                <input name="cognome" required className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input name="email" type="email" required className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefono *</label>
              <input name="telefono" required className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Modello *</label>
              <select name="modello" required className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition bg-white">
                <option value="">Seleziona il modello</option>
                {MODELLI.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Numero di serie / Matricola *</label>
              <input name="matricola" required placeholder="Es. AZXNV..." className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 uppercase focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data di acquisto *</label>
              <input name="dataAcquisto" type="date" required className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Numero ordine (opzionale)</label>
              <input name="numeroOrdine" className="w-full border border-gray-300 rounded-lg px-3.5 py-2.5 focus:ring-2 focus:ring-[#1A4731] focus:border-transparent outline-none transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prova d'acquisto (foto o PDF)</label>
              <input name="provaAcquisto" type="file" accept="image/*,.pdf" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" />
            </div>

            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" name="privacy" required className="mt-1 rounded border-gray-300 text-[#1A4731] focus:ring-[#1A4731]" />
                <span>Accetto la privacy policy e il trattamento dei dati per la gestione della garanzia. *</span>
              </label>

              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input type="checkbox" name="batteria" required className="mt-1 rounded border-gray-300 text-[#1A4731] focus:ring-[#1A4731]" />
                <span>
                  <strong>Dichiaro di aver letto e compreso integralmente le istruzioni relative alla batteria al litio. *</strong> *
                </span>
              </label>
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-100 p-4 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A4731] hover:bg-[#163c29] text-white font-medium py-3.5 px-4 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Registrazione in corso..." : "Registra garanzia"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Assistenza e ricambi originali gestiti direttamente in Italia
        </p>
      </main>
    </div>
  );
}

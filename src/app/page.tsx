import Link from "next/link";
import type { Metadata } from "next";

// Titolo/descrizione specifici della home: sovrascrivono il default
// "Registrazione Garanzia" ereditato dal layout, che resta corretto
// per /registrazione così com'è.
export const metadata: Metadata = {
  title: "MGI Golf Italia — Assistenza e Garanzia ufficiale",
  description:
    "Partner ufficiale MGI per l'Italia. Assistenza e ricambi originali gestiti direttamente in Italia da Vertical Solution.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f8f9f8] flex flex-col">
      <header className="bg-[#1A4731] text-white">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="text-xs tracking-widest text-[#C9A84C] font-medium mb-1">MGI GOLF ITALIA</div>
          <h1 className="text-xl font-semibold">Partner ufficiale per l&apos;Italia</h1>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Benvenuto</h2>
          <p className="text-gray-600 leading-relaxed mb-8">
            Assistenza e ricambi originali per il tuo carrello MGI, gestiti direttamente in Italia.
          </p>
          <Link
            href="/registrazione"
            className="inline-block w-full bg-[#1A4731] hover:bg-[#163c29] text-white font-medium py-3.5 px-4 rounded-xl transition"
          >
            Registra la tua garanzia
          </Link>
        </div>
      </main>
    </div>
  );
}

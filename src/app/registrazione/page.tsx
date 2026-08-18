import { fetchCarrelli } from "@/lib/carrelli-catalogo";
import { leggiPrecompilazione } from "@/lib/precompilazione";
import { matricolaGiaRegistrata } from "@/lib/matricola-admin";
import RegistrazioneForm from "./RegistrazioneForm";

function GiaRegistrato() {
  return (
    <div className="min-h-screen bg-[#f8f9f8] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Carrello già registrato</h1>
        <p className="text-gray-600 mb-2">
          Questo carrello risulta già registrato nel nostro sistema.
        </p>
        <p className="text-sm text-gray-500">
          Se hai acquistato il carrello usato o pensi si tratti di un errore, scrivici a{" "}
          <a href="mailto:support@verticalgolf.it" className="text-[#1A4731] hover:underline">
            support@verticalgolf.it
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default async function RegistrazionePage({
  searchParams,
}: {
  searchParams: Promise<{ precompila?: string }>;
}) {
  const carrelli = await fetchCarrelli();
  const { precompila } = await searchParams;

  const precompilazione = precompila ? await leggiPrecompilazione(precompila) : null;

  if (precompilazione?.matricola && (await matricolaGiaRegistrata(precompilazione.matricola))) {
    return <GiaRegistrato />;
  }

  return <RegistrazioneForm carrelli={carrelli} precompilazione={precompilazione} />;
}

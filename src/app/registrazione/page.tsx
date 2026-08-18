import { fetchCarrelli } from "@/lib/carrelli-catalogo";
import RegistrazioneForm from "./RegistrazioneForm";

export default async function RegistrazionePage() {
  const carrelli = await fetchCarrelli();
  return <RegistrazioneForm carrelli={carrelli} />;
}

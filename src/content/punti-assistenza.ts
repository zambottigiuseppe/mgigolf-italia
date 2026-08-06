export type PuntoAssistenza = {
  nome: string;
  citta: string;
  indirizzo?: string;
  telefono?: string;
  email?: string;
  sito?: string;
  note?: string;
};

export type RegioneAssistenza = {
  id: string;
  regione: string;
  punti: PuntoAssistenza[];
};

export const puntiAssistenza: RegioneAssistenza[] = [
  {
    id: "lombardia",
    regione: "Lombardia",
    punti: [
      {
        nome: "Vertical Golf",
        citta: "Rovato (BS)",
        indirizzo: "Via Padania 27, 25038 Rovato (BS)",
        telefono: "+39 348 3135370",
        email: "direzione@verticalgolf.it",
        sito: "https://verticalgolf.it",
        note: "Partner ufficiale MGI per l’Italia – Assistenza e ricambi"
      }
    ]
  },
  {
    id: "piemonte",
    regione: "Piemonte",
    punti: [
      {
        nome: "HubOut",
        citta: "Torino",
        indirizzo: "Corso Regina Margherita 22, 10153 Torino",
        telefono: "011 9616169",
        email: "info@hubout.shop",
        sito: "https://hubout.shop",
        note: "Punto assistenza autorizzato MGI"
      }
    ]
  }
];

// Riconosce il tipo (250/299/225 Wh) dal prefisso della matricola fisica della batteria.
// 8.8AH... = 250Wh, 10.4AH... = 299Wh, EB225... = 225Wh
// Portato identico da gestionale-next/lib/batterie.ts per restare coerenti: la
// stessa matricola deve dare lo stesso tipo, sia registrata dal cliente qui sia
// letta dal gestionale interno.
export function tipoDaMatricola(matricola: string): string | null {
  const m = (matricola || "").toUpperCase().replace(/\s/g, "");
  if (m.startsWith("10.4AH")) return "299";
  if (m.startsWith("8.8AH")) return "250";
  if (m.startsWith("EB225")) return "225";
  return null;
}

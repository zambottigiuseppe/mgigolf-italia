import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT non configurata");
  }

  const serviceAccount = JSON.parse(raw);

  return initializeApp({
    credential: cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: String(serviceAccount.private_key).replace(/\\n/g, "\n"),
    }),
  });
}

// Inizializzazione pigra: avviene alla prima richiesta, non durante la build.
let cached: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!cached) {
    cached = getFirestore(getAdminApp());
  }
  return cached;
}

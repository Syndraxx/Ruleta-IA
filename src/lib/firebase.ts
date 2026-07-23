import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Inicializar la aplicación Firebase
const app = initializeApp({
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId
});

// Inicializar Firestore con el ID de base de datos específico si existe
const dbId = firebaseConfig.firestoreDatabaseId;
export const db = dbId && dbId !== "(default)" 
  ? getFirestore(app, dbId) 
  : getFirestore(app);

// Inicializar la autenticación
export const auth = getAuth(app);

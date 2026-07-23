import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Mail, 
  LogOut, 
  Cloud, 
  Database, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle,
  Key
} from "lucide-react";
import { auth } from "../../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { FirebaseService, SorteoItem } from "../../services/firebaseService";

interface FirebaseUserAuthWidgetProps {
  darkMode: boolean;
  localResults: SorteoItem[];
  onSyncWithFirestore: (firebaseItems: SorteoItem[]) => void;
  playSound: (sound: string) => void;
}

export function FirebaseUserAuthWidget({
  darkMode,
  localResults,
  onSyncWithFirestore,
  playSound
}: FirebaseUserAuthWidgetProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Auth Form States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Firestore Sync & Migration States
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [firestoreCount, setFirestoreCount] = useState<number>(0);
  const [isMigrating, setIsMigrating] = useState<boolean>(false);
  const [migrationSuccess, setMigrationSuccess] = useState<boolean>(false);

  // Monitor auth status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Al autenticarse, iniciar sincronización en tiempo real
        setSyncStatus("syncing");
        const unsubFirestore = FirebaseService.listenToSorteos((items) => {
          setFirestoreCount(items.length);
          if (items.length > 0) {
            onSyncWithFirestore(items);
          }
          setSyncStatus("synced");
        });
        return () => unsubFirestore();
      } else {
        setSyncStatus("idle");
        setFirestoreCount(0);
      }
    });

    return () => unsubscribe();
  }, [onSyncWithFirestore]);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Por favor completa todos los campos.");
      return;
    }

    setAuthError("");
    setActionLoading(true);
    playSound("click");

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      console.error(err);
      let errMsg = "Ocurrió un error en la autenticación.";
      if (err.code === "auth/operation-not-allowed") {
        errMsg = "El método de inicio de sesión con Correo/Contraseña no está habilitado en tu consola de Firebase. Por favor, ve a Firebase Console -> Authentication -> Sign-in method y activa 'Correo electrónico/contraseña'.";
      } else if (err.code === "auth/invalid-credential") {
        errMsg = "Credenciales incorrectas. Verifica tu correo y contraseña.";
      } else if (err.code === "auth/email-already-in-use") {
        errMsg = "Este correo electrónico ya está registrado.";
      } else if (err.code === "auth/weak-password") {
        errMsg = "La contraseña debe tener al menos 6 caracteres.";
      } else if (err.code === "auth/invalid-email") {
        errMsg = "El formato del correo electrónico no es válido.";
      }
      setAuthError(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    playSound("click");
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    }
  };

  const handleMigrateData = async () => {
    if (!user) return;
    setIsMigrating(true);
    playSound("click");
    try {
      const { migratedCount } = await FirebaseService.migrateLocalToFirestore(localResults);
      console.log(`Migrados ${migratedCount} registros locales a Firestore.`);
      setMigrationSuccess(true);
      setTimeout(() => setMigrationSuccess(false), 5000);
    } catch (err) {
      console.error("Error durante la migración:", err);
    } finally {
      setIsMigrating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-2">
        <RefreshCw size={16} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-2xl border transition-all duration-150 ${
      darkMode 
        ? "bg-zinc-950/75 border-white/30 text-white" 
        : "bg-white/85 border-4 border-black comic-shadow text-black"
    }`}>
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Sección de Estado */}
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
            user 
              ? darkMode ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-emerald-100 border-emerald-300 text-emerald-700"
              : darkMode ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-gray-100 border-gray-300 text-gray-700"
          }`}>
            <Database size={20} className={user && syncStatus === "syncing" ? "animate-spin" : ""} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black uppercase tracking-wider block ${
                user ? "text-emerald-500" : "text-amber-500"
              }`}>
                {user ? "Respaldo en la Nube Activo (Firestore)" : "Persistencia Local (LocalStorage)"}
              </span>
              {user && (
                <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-black border ${
                  syncStatus === "synced" 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse"
                }`}>
                  {syncStatus === "synced" ? "SINCRONIZADO" : "SINCRONIZANDO"}
                </span>
              )}
            </div>
            
            {user ? (
              <p className={`text-xs font-bold leading-normal ${darkMode ? "text-slate-300" : "text-gray-700"}`}>
                Autenticado como: <span className="font-mono text-indigo-400">{user.email}</span> ({firestoreCount} sorteos)
              </p>
            ) : (
              <p className={`text-xs font-medium leading-normal ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
                Regístrate o inicia sesión para persistir tus sorteos de forma segura en Firestore.
              </p>
            )}
          </div>
        </div>

        {/* Sección de Acciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          {user ? (
            <>
              {localResults.length > 0 && (
                <button
                  onClick={handleMigrateData}
                  disabled={isMigrating}
                  className={`px-3 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                    migrationSuccess
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : isMigrating
                        ? "bg-slate-800 border-slate-700 text-slate-500"
                        : darkMode
                          ? "bg-indigo-600/20 border-indigo-500/35 hover:bg-indigo-600/30 text-indigo-300"
                          : "bg-indigo-50 border-2 border-black text-indigo-950 comic-shadow-small hover:bg-indigo-100"
                  }`}
                  title="Sube tus sorteos locales a tu cuenta en la nube Firestore"
                >
                  {migrationSuccess ? (
                    <>
                      <CheckCircle size={14} />
                      ¡MIGRACIÓN EXITOSA!
                    </>
                  ) : isMigrating ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      MIGRANDO...
                    </>
                  ) : (
                    <>
                      <Cloud size={14} />
                      MIGRAR LOCAL A LA NUBE ({localResults.length})
                    </>
                  )}
                </button>
              )}

              <button
                onClick={handleSignOut}
                className={`px-3 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                  darkMode 
                    ? "bg-red-950/20 border-red-500/30 text-red-400 hover:bg-red-950/40" 
                    : "bg-red-50 border-2 border-black text-red-700 comic-shadow-small hover:bg-red-100"
                }`}
              >
                <LogOut size={14} />
                CERRAR SESIÓN
              </button>
            </>
          ) : (
            <button
              onClick={() => { setShowAuthModal(true); playSound("click"); }}
              className={`px-4 py-2 text-xs font-black rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
                darkMode 
                  ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500" 
                  : "bg-indigo-600 border-2 border-black text-white comic-shadow-small hover:bg-indigo-700"
              }`}
            >
              <User size={14} />
              INICIAR SESIÓN / REGISTRARSE
            </button>
          )}
        </div>
      </div>

      {/* Modal de Autenticación */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div 
            className={`w-full max-w-md p-6 rounded-3xl shadow-2xl relative transition-all duration-200 border-4 ${
              darkMode 
                ? "bg-slate-950 border-indigo-500/45 text-white" 
                : "bg-white border-black text-black"
            }`}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 border ${
                darkMode ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" : "bg-indigo-50 border-black text-indigo-700"
              }`}>
                <Key size={24} />
              </div>
              <h3 className="text-lg font-black tracking-tight">
                {isSignUp ? "REGISTRAR NUEVA CUENTA" : "INICIAR SESIÓN"}
              </h3>
              <p className={`text-[10px] uppercase font-bold mt-1 ${darkMode ? "text-slate-400" : "text-gray-500"}`}>
                Respaldo y sincronización de datos de la Ruleta
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthAction} className="space-y-4">
              <div>
                <label className={`text-[10px] uppercase font-black block mb-1.5 ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
                  Correo Electrónico
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold font-mono outline-hidden border-2 ${
                      darkMode 
                        ? "bg-slate-900 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-black text-black focus:border-indigo-600"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-[10px] uppercase font-black block mb-1.5 ${darkMode ? "text-slate-400" : "text-gray-600"}`}>
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-bold font-mono outline-hidden border-2 ${
                      darkMode 
                        ? "bg-slate-900 border-slate-800 text-white focus:border-indigo-500" 
                        : "bg-slate-50 border-black text-black focus:border-indigo-600"
                    }`}
                  />
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 flex items-start gap-2 text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span className="font-bold">{authError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={actionLoading}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer flex items-center justify-center gap-2 border-2 ${
                  darkMode 
                    ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500" 
                    : "bg-indigo-600 border-black text-white hover:bg-indigo-700 comic-shadow-small"
                }`}
              >
                {actionLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : null}
                {isSignUp ? "REGISTRAR CUENTA" : "INGRESAR AL SISTEMA"}
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setAuthError(""); playSound("click"); }}
                className="text-[10px] font-black uppercase tracking-wider text-indigo-400 hover:underline"
              >
                {isSignUp ? "¿Ya tienes una cuenta? Inicia Sesión" : "¿No tienes cuenta? Regístrate aquí"}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => { setShowAuthModal(false); playSound("click"); }}
              className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border cursor-pointer hover:bg-red-500 hover:text-white transition-all ${
                darkMode ? "border-slate-800 text-slate-400" : "border-black text-black"
              }`}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

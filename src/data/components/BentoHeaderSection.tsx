import { useState, useEffect, useRef } from "react";
import { Clock, Minimize2, Maximize2, Volume2, VolumeX, Bell, BellOff } from "lucide-react";

interface BentoHeaderSectionProps {
  darkMode: boolean;
  handleThemeChange: (dark: boolean) => void;
  darkContrast: "profundo" | "tecnologico";
  handleDarkContrastChange: (contrast: "profundo" | "tecnologico") => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  notificationsEnabled: boolean;
  handleToggleNotifications: () => void;
  toggleFullscreen: () => void;
  isFullscreen: boolean;
  playSound: (sound: string) => void;
  triggerCierreNotification: (hourStr: string) => void;
  loteria: string;
  dynamicColdestAnimal: {
    code: string;
    days: number;
    meta: { name: string; emoji: string } | null;
  };
  fontSize: "normal" | "grande" | "gigante" | "xl";
  setFontSize: (size: "normal" | "grande" | "gigante" | "xl") => void;
}

const GlassDecoration = () => (
  <div className="LiquidGlass-effect pointer-events-none rounded-2xl opacity-[0.06] dark:opacity-[0.12] select-none -z-10 absolute inset-0" />
);

export function BentoHeaderSection({
  darkMode,
  handleThemeChange,
  darkContrast,
  handleDarkContrastChange,
  soundEnabled,
  setSoundEnabled,
  notificationsEnabled,
  handleToggleNotifications,
  toggleFullscreen,
  isFullscreen,
  playSound,
  triggerCierreNotification,
  loteria,
  dynamicColdestAnimal,
  fontSize,
  setFontSize,
}: BentoHeaderSectionProps) {
  // Localized state for performance, preventing top-level App re-renders every 1 second
  const [reloj, setReloj] = useState<string>("00:00:00");
  const [cierreMin, setCierreMin] = useState<string>("00:00");
  const [cierreCountdown, setCierreCountdown] = useState<string>("00:00");
  const [proximoSorteo, setProximoSorteo] = useState<string>("");
  const [alertVisible, setAlertVisible] = useState<boolean>(false);

  const lastNotifiedCierreRef = useRef<string | null>(null);

  const textMutedTheme = darkMode ? "text-slate-305 text-slate-300" : "text-gray-600 font-semibold";

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12; 
      const hoursStr = String(hours).padStart(2, "0");
      const str = `${hoursStr}:${minutes}:${seconds} ${ampm}`;
      setReloj(str);

      // closure rules: active alert in Venezuelan timezone (UTC-4)
      const nowUtc = new Date();
      const vzlOffset = -4 * 60 * 60 * 1000;
      const vzlDate = new Date(nowUtc.getTime() + vzlOffset);
      const min = vzlDate.getUTCMinutes();
      const sec = vzlDate.getUTCSeconds();
      const currentHour = vzlDate.getUTCHours();

      // Show alert visual warning if min is between 35 and 40 (5 mins before closure)
      const isBettingClosureRange = min >= 35 && min < 40;
      setAlertVisible(isBettingClosureRange);

      // Calculate target closing date/time (Venezuela UTC-4)
      const targetHourVal = min < 40 ? currentHour : (currentHour + 1) % 24;
      const targetDate = new Date(vzlDate);
      targetDate.setUTCHours(targetHourVal, 40, 0, 0);
      
      if (targetDate.getTime() < vzlDate.getTime()) {
        targetDate.setUTCDate(targetDate.getUTCDate() + 1);
      }
      
      const diffMs = targetDate.getTime() - vzlDate.getTime();
      const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
      const countdownMins = Math.floor(diffSecs / 60);
      const countdownSecs = diffSecs % 60;
      
      const countdownStr = `${String(countdownMins).padStart(2, "0")}:${String(countdownSecs).padStart(2, "0")}`;
      setCierreCountdown(countdownStr);
      
      // Proximo sorteo (1 hour after the closing hour target)
      const targetDrawingHour = (targetHourVal + 1) % 24;
      const displayDrawLabel = `${targetDrawingHour % 12 || 12}:00 ${targetDrawingHour >= 12 ? "PM" : "AM"}`;
      setProximoSorteo(displayDrawLabel);
      
      // Proximo cierre hour representation
      const displayCierreTime = `${targetHourVal % 12 || 12}:40 ${targetHourVal >= 12 ? "PM" : "AM"}`;
      setCierreMin(displayCierreTime);

      // Check Notification triggers exactly once at minute 35:00
      if (min === 35 && sec === 0) {
        const nextTargetHour = `${(currentHour + 1) % 12 || 12}:00`;
        const suffix = (currentHour + 1) >= 12 ? "PM" : "AM";
        const totalString = `${nextTargetHour} ${suffix}`;
        if (lastNotifiedCierreRef.current !== totalString) {
          lastNotifiedCierreRef.current = totalString;
          triggerCierreNotification(totalString);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [notificationsEnabled, triggerCierreNotification]);

  return (
    <>
      {/* Header Bento Block */}
      <header className={`flex flex-col md:flex-row justify-between items-stretch md:items-center p-4 sm:px-6 sm:py-4 gap-4 transition-all duration-150 relative overflow-hidden ${
        darkMode 
          ? "bg-zinc-950/75 border border-white/30 rounded-2xl shadow-xl text-white" 
          : "bg-white/85 border-4 border-black comic-shadow rounded-2xl text-black"
      }`}>
        <GlassDecoration />
        <div className="flex items-center gap-3 relative z-10">
          <div className={`px-3 py-1.5 rounded-xl text-[10px] uppercase font-black tracking-wider border select-none animate-pulse ${
            darkMode ? "bg-blue-600/15 text-blue-400 border-blue-500/20" : "bg-blue-100 border-2 border-black text-blue-900 font-black"
          }`}>
            ● PRO IA
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight select-none font-sans">RULETA PRO IA</h1>
            <p className={`text-[10px] font-bold tracking-wider uppercase ${textMutedTheme}`}>Plataforma Predictiva de Correlación Venezolana</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          {/* Selector de Tamaño de Letra (Accesibilidad Visual) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl h-10 select-none border-2 border-black bg-white text-black shadow-sm dark:bg-[#182033] dark:border-slate-800">
            <span className="text-[10px] font-black tracking-wider uppercase px-1.5 text-slate-500 dark:text-slate-400">LETRA:</span>
            <button
              onClick={() => { setFontSize("normal"); playSound("click"); }}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all h-7 cursor-pointer flex items-center justify-center ${
                fontSize === "normal"
                  ? darkMode ? "bg-indigo-500 text-white font-black" : "bg-slate-900 text-white font-black"
                  : darkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Letra Normal"
            >
              A
            </button>
            <button
              onClick={() => { setFontSize("grande"); playSound("click"); }}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all h-7 cursor-pointer flex items-center justify-center ${
                fontSize === "grande"
                  ? "bg-indigo-600 text-white font-black"
                  : darkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Letra Grande"
            >
              A+
            </button>
            <button
              onClick={() => { setFontSize("gigante"); playSound("click"); }}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all h-7 cursor-pointer flex items-center justify-center ${
                fontSize === "gigante"
                  ? "bg-emerald-600 text-white font-black"
                  : darkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Letra Gigante"
            >
              A++
            </button>
            <button
              onClick={() => { setFontSize("xl"); playSound("click"); }}
              className={`px-2 py-0.5 text-xs font-bold rounded-lg transition-all h-7 cursor-pointer flex items-center justify-center ${
                fontSize === "xl"
                  ? "bg-rose-600 text-white font-black"
                  : darkMode ? "text-slate-400 hover:text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
              title="Letra Súper Grande"
            >
              A+++
            </button>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => { handleThemeChange(!darkMode); playSound("click"); }} 
            className={`p-2.5 rounded-xl transition duration-150 shadow-inner cursor-pointer flex items-center justify-center gap-1.5 font-black text-xs h-10 ${
              darkMode 
                ? "bg-[#182033] border border-slate-805 text-[#FFDE4D] hover:text-white hover:bg-slate-800"
                : "bg-[#FFDE4D] border-2 border-black text-black hover:bg-yellow-450 comic-shadow-small"
            }`}
            title={darkMode ? "Estilo Claro" : "Estilo Oscuro"}
          >
            {darkMode ? "☀️ CLARO" : "🌙 OSCURO"}
          </button>

          {/* Selector de Contraste para el Modo Oscuro (Accesibilidad Visual) */}
          {darkMode && (
            <div className="flex items-center gap-1 p-1 rounded-xl h-10 select-none border-2 border-black bg-white text-black dark:bg-[#182033] dark:border-[#2b3a55]">
              <span className="text-[9px] font-black tracking-wider uppercase px-1 text-slate-500 dark:text-slate-400">FONDO:</span>
              <button
                onClick={() => { handleDarkContrastChange("profundo"); playSound("click"); }}
                className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg transition-all h-7 cursor-pointer flex items-center justify-center ${
                  darkContrast === "profundo"
                    ? "bg-[#030712] border border-slate-600 text-white font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
                }`}
                title="Fondo Profundo (Casi Negro)"
              >
                ⚫ Profundo
              </button>
              <button
                onClick={() => { handleDarkContrastChange("tecnologico"); playSound("click"); }}
                className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-lg transition-all h-7 cursor-pointer flex items-center justify-center ${
                  darkContrast === "tecnologico"
                    ? "bg-[#0b1120] border border-slate-600 text-white font-extrabold"
                    : "text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white"
                }`}
                title="Fondo Tecnológico (Azul Marino Oscuro)"
              >
                🔵 Tecno
              </button>
            </div>
          )}

          {/* Audio Toggle */}
          <button 
            onClick={() => { setSoundEnabled(!soundEnabled); playSound("click"); }} 
            className={`p-2.1 rounded-xl transition duration-150 shadow-inner cursor-pointer h-10 w-10 flex items-center justify-center ${
              darkMode
                ? "bg-[#182033] border border-slate-800 text-slate-350 hover:text-white"
                : "bg-white border-2 border-black text-black hover:bg-slate-50 comic-shadow-small"
            }`}
          >
            {soundEnabled ? <Volume2 size={18} className="text-[#FFDE4D]" /> : <VolumeX size={18} className="text-red-500" />}
          </button>

          {/* Desktop Notifications Toggle */}
          <button 
            onClick={handleToggleNotifications}
            className={`p-2.1 rounded-xl transition duration-150 shadow-inner cursor-pointer h-10 w-10 flex items-center justify-center ${
              darkMode
                ? "bg-[#182033] border border-slate-800 text-slate-350 hover:text-white"
                : "bg-white border-2 border-black text-black hover:bg-slate-50 comic-shadow-small"
            }`}
          >
            {notificationsEnabled ? <Bell size={18} className="text-[#FFDE4D] animate-bounce" /> : <BellOff size={18} className="text-red-500" />}
          </button>

          {/* Fullscreen Button */}
          <button 
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition duration-150 shadow-inner cursor-pointer h-10 px-3.5 flex items-center justify-center gap-1.5 font-black text-xs ${
              darkMode
                ? "bg-[#182033] border border-slate-800 text-[#FFDE4D] hover:text-white hover:bg-slate-800"
                : "bg-blue-50 border-2 border-black text-blue-950 hover:bg-blue-105 comic-shadow-small"
            }`}
            title="Pantalla Completa"
          >
            {isFullscreen ? <Minimize2 size={16} className="text-amber-400" /> : <Maximize2 size={16} className="text-blue-500" />}
            <span className="hidden sm:inline">{isFullscreen ? "MINIMIZAR" : "PANTALLA COMPLETA"}</span>
          </button>

          {/* Time Indicators */}
          <div className={`flex items-center px-4 py-2 rounded-xl shadow-inner font-extrabold text-xs gap-2 select-none h-10 ${
            darkMode ? "bg-[#182033] border border-slate-800 text-slate-300" : "bg-slate-50 border-2 border-black text-black"
          }`}>
            <Clock size={14} className="text-blue-500" />
            <span className="font-mono text-xs tracking-wider">{reloj}</span>
          </div>

          <div className={`flex items-center px-4 py-2 rounded-xl shadow-inner font-extrabold text-xs gap-2.5 select-none h-10 transition-all duration-300 ${
            alertVisible 
              ? "bg-red-950/90 border border-red-500 text-red-200 animate-pulse-fast shadow-md" 
              : darkMode 
                ? "bg-[#162235] border border-[#2b3a55] text-indigo-300" 
                : "bg-indigo-50 border-2 border-black text-indigo-950 comic-shadow-small"
          }`}>
            <Clock size={14} className={`${alertVisible ? "text-red-400 animate-ping" : "text-indigo-400 animate-pulse"}`} />
            <div className="flex flex-col text-left justify-center h-full">
              <span className="text-[7.5px] uppercase tracking-wider font-extrabold font-mono leading-none mb-0.5">
                {proximoSorteo ? `CIERRE ${proximoSorteo}` : 'CIERRE:'}
              </span>
              <span className="font-mono text-[11px] font-black tracking-tight leading-none">
                {cierreMin} {cierreCountdown && <span className="text-[#FFDE4D]">{`(${cierreCountdown})`}</span>}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Extreme Inactivity Alert block */}
      {dynamicColdestAnimal.code && (
        <div className="border border-red-500/35 bg-[#1f1112] text-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg select-none">
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
            <span className="bg-red-700 text-white px-2 py-0.5 rounded text-[9px] font-black uppercase text-center tracking-wide font-mono">⚠️ ALERTA EXTREMA</span>
            <span className="font-bold text-slate-100 leading-normal">
              El {" "}
              <span className="bg-slate-800 text-slate-100 font-mono text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 border border-slate-700 font-black">
                {dynamicColdestAnimal.code} {dynamicColdestAnimal.meta?.emoji}
              </span>{" "}
              lleva <span className="text-red-400 font-extrabold underline decoration-2">{dynamicColdestAnimal.days} días</span> sin salir en {loteria}. ¡Inercia inminente de arrastre!
            </span>
          </div>
          <span className="text-[8px] text-red-400/80 font-mono tracking-widest hidden md:inline-block uppercase font-black">MONITOREO DE RETRIBUCIÓN</span>
        </div>
      )}

      {/* Betting hours closure warning */}
      {alertVisible && (
        <div className="bg-gradient-to-r from-red-950 via-rose-950 to-red-950/90 text-red-200 py-3 px-6 border border-red-500 rounded-2xl font-black text-center uppercase tracking-wider text-xs animate-pulse-fast select-none flex items-center justify-center gap-2.5 shadow-lg shadow-red-950/30">
          <span className="text-sm">⚠️</span>
          <span>¡ATENCIÓN! QUEDAN SÓLO <span className="bg-black/40 px-2 py-0.5 rounded-lg text-[#FFDE4D] font-mono tracking-widest text-[13px] border border-red-500/30">{cierreCountdown}</span> PARA EL CIERRE DE ESTE SORTEO. ¡TOMA PREVISIONES RÁPIDAMENTE!</span>
        </div>
      )}
    </>
  );
}

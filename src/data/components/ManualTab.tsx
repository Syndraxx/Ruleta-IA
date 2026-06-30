import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  Video,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  RefreshCw,
  Terminal,
  Maximize2,
  FileText,
  Sparkles,
  Compass,
  HelpCircle,
  Sparkle,
  Clock
} from "lucide-react";

// @ts-ignore
import urlDiagrama from "../assets/images/diagrama_arquitectura_1781443858306.jpg";
// @ts-ignore
import urlDashboard from "../assets/images/poker_dashboard_1781385362013.jpg";
// @ts-ignore
import urlTrilogy from "../assets/images/trilogy_predictions_1781385375930.jpg";

interface ManualTabProps {
  darkMode: boolean;
  cardTheme: string;
  textMutedTheme: string;
  inputTheme: string;
  playSound: (soundName: string) => void;
}

export function ManualTab({
  darkMode,
  cardTheme,
  textMutedTheme,
  inputTheme,
  playSound
}: ManualTabProps) {
  const [manualTab, setManualTab] = useState<"architecture" | "operation" | "equations" | "simulation">("architecture");
  const [simStep, setSimStep] = useState<number>(0);
  const [simPlaying, setSimPlaying] = useState<boolean>(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Auto-playback simulation logic
  useEffect(() => {
    let timer: any;
    if (simPlaying) {
      timer = setInterval(() => {
        setSimStep((prev) => (prev + 1) % 5);
      }, 4000);
    }
    return () => clearInterval(timer);
  }, [simPlaying]);

  return (
    <div className="flex flex-col gap-5.5 animate-fadeIn">
      {/* Header / Intro banner styled like a cosmic vintage comic */}
      <div className={`${cardTheme} p-6 border-b-8 border-rose-500 relative overflow-hidden comic-shadow`}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.04] text-rose-500 pointer-events-none select-none">
          <BookOpen size={160} className="stroke-[3]" />
        </div>
        <div className="relative z-10 space-y-3">
          <span className="bg-rose-500/25 border border-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-[9px] font-black font-mono uppercase tracking-widest leading-none bg-rose-950/20 inline-block">
            📖 CENTRO DE DOCUMENTACIÓN OFICIAL V3.5
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase font-sans">
            MANUAL DE USUARIO RULETA PRO IA
          </h1>
          <p className={`text-xs leading-relaxed max-w-3xl font-sans ${textMutedTheme}`}>
            Bienvenido al manual interactivo oficial de la plataforma predictiva líder de correlación venezolana. Aquí aprenderás exactamente cómo funcionan nuestros algoritmos, los sistemas de extracción en tiempo real, las ecuaciones analíticas de trilogías de arrastre, y la ruleta especial cómic.
          </p>
        </div>

        {/* Sub-navigation tabs inside the manual */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
          {[
            { id: "architecture", label: "Arquitectura", emoji: "⚙️" },
            { id: "operation", label: "Operación", emoji: "📊" },
            { id: "equations", label: "Ecuaciones", emoji: "🔮" },
            { id: "simulation", label: "Simulador de Flujo", emoji: "🎬" }
          ].map((t) => {
            const isActive = manualTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  playSound("click");
                  setManualTab(t.id as any);
                }}
                className={`py-3 px-2.5 rounded-xl border-2 font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none ${
                  isActive
                    ? darkMode
                      ? "bg-rose-500/20 text-rose-300 border-rose-500 shadow-md shadow-rose-500/5 font-black"
                      : "bg-rose-500 text-white border-black font-black comic-shadow-small"
                    : darkMode
                      ? "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                      : "bg-slate-50 border-gray-400 text-gray-700 hover:text-black hover:bg-slate-100"
                }`}
              >
                <span className="text-xs">{t.emoji}</span>
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT SPANS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5.5 items-stretch">
        {/* TAB 1: ARQUITECTURA */}
        {manualTab === "architecture" && (
          <>
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`${cardTheme} p-5 space-y-4 shadow-xl border-t-4 border-blue-500`}>
                <span className="bg-blue-500/15 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest leading-none">
                  ⚙️ FLUJO DE DATOS, ARCHIVOS Y ARQUITECTURA
                </span>
                <h2 className="text-lg font-black uppercase text-white font-sans leading-none">
                  FLUJO DE TRABAJO DEL MÓDULO INTELIGENTE
                </h2>
                <div className="space-y-3 text-sm md:text-base leading-relaxed text-slate-300">
                  <p>
                    Nuestra aplicación funciona guardando todo en tu propio celular o computadora, para que tus datos de juego siempre estén totalmente seguros y accesibles para ti.
                  </p>

                  <div className="space-y-3.5 mt-4">
                    <div className="flex gap-3 items-start">
                      <span className="bg-blue-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">1</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans">Consulta rápida de resultados:</strong>
                        <span className="text-slate-350 text-xs md:text-sm">Cuando eliges Loto Activo o La Granjita, la aplicación busca de inmediato los resultados oficiales de la fecha elegida de una forma rápida, confiable y segura.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="bg-blue-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">2</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans">Tus sugerencias bien guardadas:</strong>
                        <span className="text-slate-350 text-xs md:text-sm">Todo lo que guardas o cambias de forma manual se queda grabado en tu propio celular o navegador al instante, para que no pierdas nada si cierras la ventana.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="bg-blue-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">3</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans">Sugerencias recomendadas:</strong>
                        <span className="text-slate-350 text-xs md:text-sm">Apenas se reciben los resultados oficiales, te mostramos los animalitos recomendados tradicionales que tienen mayor energía, racha y afinidad con los que salieron.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="bg-blue-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">4</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans font-extrabold">Descarga y copia tus datos:</strong>
                        <span className="text-slate-350 text-xs md:text-sm">Puedes descargar todas tus jugadas y resultados en un solo archivito muy ligero para guardarlo o abrirlo en otro celular o computadora cuando quieras.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory callout styled like action banner */}
              <div className="bg-[#1e131d]/75 text-pink-300 border border-pink-900 border-t-4 p-4 rounded-2xl text-xs space-y-1.5 comic-shadow">
                <strong className="text-pink-400 font-black uppercase font-mono text-[10.5px] block">💡 DATOS DE TRANSFERENCIA PROTEGIDOS</strong>
                <p className="leading-relaxed text-slate-300">
                  La conexión local es totalmente autónoma. Los archivos importados o descargados no requieren servidores propietarios, lo que significa privacidad total e inmunidad a caídas del hosting.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className={`${cardTheme} p-5 space-y-3.5 flex flex-col justify-between border-t-4 border-blue-500 shadow-xl`}>
                <div className="space-y-1.5">
                  <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest leading-none">
                    📸 DIAGRAMA SECUENCIAL
                  </span>
                  <h3 className="text-xs font-black uppercase text-white font-sans">DIAGRAMA DIAGNÓSTICO DE ARQUITECTURA</h3>
                  <p className={`text-[10.5px] leading-normal font-sans ${textMutedTheme}`}>
                    Haz clic sobre el diagrama para verlo en alta resolución y examinar los flujos del conector del scraper.
                  </p>
                </div>

                {/* Diagnostic architectural image render */}
                <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center p-1 cursor-zoom-in" onClick={() => setZoomedImage(urlDiagrama)}>
                  <img src={urlDiagrama} alt="Diagrama de Arquitectura" className="w-full h-auto object-cover rounded-lg group-hover:scale-105 transition-all duration-300 select-none" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="bg-yellow-400 text-black border-2 border-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow comic-shadow-small transform translate-y-2 group-hover:translate-y-0 transition-all font-sans">
                      <Maximize2 size={11} /> AMPLIAR DIAGRAMA
                    </span>
                  </div>
                </div>

                <span className="text-[9.5px] text-slate-400 italic font-mono text-center">
                  *Mapeado de Scraperia.py a React/Vite local App (Compilado en producción)
                </span>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: OPERACIÓN */}
        {manualTab === "operation" && (
          <>
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`${cardTheme} p-5 space-y-4 shadow-xl border-t-4 border-green-500`}>
                <span className="bg-green-500/15 border border-green-500/20 text-green-400 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest leading-none">
                  📊 OPERATIVA DEL PANEL PRINCIPAL Y CONTROL
                </span>
                <h2 className="text-lg font-black uppercase text-white font-sans leading-none">
                  GUÍA PASO A PASO PARA OPERAR LA APP
                </h2>
                <div className="space-y-3 text-xs leading-relaxed font-sans text-slate-300">
                  <p>
                    Operar la plataforma es extremadamente simple gracias a su consistencia visual. Sigue este ciclo diario para maximizar tu eficiencia:
                  </p>

                  <div className="space-y-2.5 mt-3">
                    <div className="flex gap-2.5 items-start">
                      <span className="bg-green-500 text-black font-black font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">1</span>
                      <div>
                        <strong className="text-white uppercase text-[10px] block font-mono">Carga de Resultados Diarios (Auto / Manual):</strong>
                        <span className="text-slate-300">Utiliza la pestaña <strong>Panel</strong>. Elige tu lotería favorita y pulsa "OBTENER RESULTADOS". Si un sorteo no está registrado, haz clic sobre su casilla para asignar el animalito manualmente en segundos o usa el bulk WhatsApp.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="bg-green-500 text-black font-black font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">2</span>
                      <div>
                        <strong className="text-white uppercase text-[10px] block font-mono">Análisis y Seguimiento de Tendencias:</strong>
                        <span className="text-slate-300">Haz clic en <strong>Tendencias</strong> para auditar patrones de arrastre, repeticiones calientes, y verificar cuáles coeficientes ecológicos están listos para eclosión en la rueda.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="bg-green-500 text-black font-black font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">3</span>
                      <div>
                        <strong className="text-white uppercase text-[10px] block font-mono">Boleto de Apuesta Virtual:</strong>
                        <span className="text-slate-300">Añade simulaciones de apuestas seleccionando un sorteo y animalito. Define el peso del tiro para modelar tu banca virtual y mantén un registro de rendimiento detallado.</span>
                      </div>
                    </div>

                    <div className="flex gap-2.5 items-start">
                      <span className="bg-green-500 text-black font-black font-mono text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">4</span>
                      <div>
                        <strong className="text-white uppercase text-[10px] block font-mono">Archivado y Almacenamiento Seguro:</strong>
                        <span className="text-slate-300">Al final de la jornada de juego, presiona "ARCHIVAR DÍA" en la sección de control para asentar los resultados en el historial histórico de tendencias perpetuas.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory callout */}
              <div className="bg-[#131d2e]/75 text-blue-300 border border-blue-900 border-t-4 p-4 rounded-2xl text-xs space-y-1.5 comic-shadow">
                <strong className="text-blue-400 font-black uppercase font-mono text-[10.5px] block">🔔 ALERTA DE HORAS DE CORTE DIARIAS</strong>
                <p className="leading-relaxed text-slate-300">
                  La barra superior muestra un temporizador de cierre dinámico en rojo. Quedan bloqueados los tiros computados de manera estricta al rebasar el minuto 40 de cada sorteo simulado para preservar realismo táctico.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className={`${cardTheme} p-5 space-y-3.5 flex flex-col justify-between border-t-4 border-green-500 shadow-xl`}>
                <div className="space-y-1.5">
                  <span className="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest leading-none">
                    📸 INTERFAZ DIRECTO
                  </span>
                  <h3 className="text-xs font-black uppercase text-white font-sans">PANTALLA DE CONTROL GENERAL</h3>
                  <p className={`text-[10.5px] leading-normal font-sans ${textMutedTheme}`}>
                    Muestra el diseño del panel optimizado, los grids modulares de horas, el simulador de boletos y la terminal de comandos.
                  </p>
                </div>

                {/* Dashboard screen view image */}
                <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center p-1 cursor-zoom-in" onClick={() => setZoomedImage(urlDashboard)}>
                  <img src={urlDashboard} alt="Panel General Dashboard" className="w-full h-auto object-cover rounded-lg group-hover:scale-105 transition-all duration-300 select-none" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="bg-yellow-400 text-black border-2 border-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow comic-shadow-small transform translate-y-2 group-hover:translate-y-0 transition-all font-sans">
                      <Maximize2 size={11} /> AMPLIAR IMAGEN
                    </span>
                  </div>
                </div>

                <span className="text-[9.5px] text-slate-400 italic font-mono text-center">
                  *Captura de interfaz interactiva con logs en vivo y grid de sorteos
                </span>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: ECUACIONES */}
        {manualTab === "equations" && (
          <>
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className={`${cardTheme} p-5 space-y-4 shadow-xl border-t-4 border-amber-500`}>
                <span className="bg-amber-500/15 border border-amber-500/20 text-yellow-400 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest leading-none">
                  🔮 MATEMÁTICA DETRÁS DE LAS TRILOGÍAS DE ARRASTRE
                </span>
                <h2 className="text-lg font-black uppercase text-white font-sans leading-none">
                  LAS ECUACIONES TRADICIONALES DE LA RULETA
                </h2>
                <div className="space-y-3 text-sm md:text-base leading-relaxed text-[#f3f4f6]">
                  <p>
                    ¿Por qué salen ciertos animales juntos? No es por casualidad; se debe a agrupaciones tradicionales de juego y secuencias históricas que los jugadores de siempre conocen muy bien:
                  </p>

                  <div className="space-y-3.5 mt-4">
                    <div className="flex gap-3 items-start">
                      <span className="bg-amber-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">A</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans">Sectores y vecinos de la ruleta:</strong>
                        <span className="text-slate-300 text-xs md:text-sm">Se refiere a los animales que están uno al lado del otro en la ruleta de juego de Venezuela. Los que están muy cerquita forman una trilogía natural de juego porque la bolita suele caer en zonas parecidas.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="bg-amber-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">B</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans">Grupos y familias por naturaleza:</strong>
                        <span className="text-slate-300 text-xs md:text-sm">Son grupos basados en la cercanía de las especies (como los de plumas, escamas, metales o mamíferos) que suelen salir en secuencias seguidas gracias a las rachas del sorteador físico.</span>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <span className="bg-amber-500 text-black font-black font-mono text-[10px] md:text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border border-black shadow">C</span>
                      <div>
                        <strong className="text-white uppercase text-xs md:text-sm block font-sans">Compañeros de la suerte con IA:</strong>
                        <span className="text-slate-300 text-xs md:text-sm">Nuestro sistema inteligente examina los sorteos de los últimos 10 días para ver qué animalitos se están "llamando" mutuamente en las rachas más recientes, es decir, cuáles se acompañan con más fuerza.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Explanatory callout */}
              <div className="bg-[#1c1c13]/75 text-amber-300 border border-amber-900 border-t-4 p-4 rounded-2xl text-xs md:text-sm space-y-1.5 comic-shadow">
                <strong className="text-amber-400 font-extrabold uppercase font-sans text-xs md:text-sm block">🧠 EXPLICACIÓN SENCILLA Y HUMANA</strong>
                <p className="leading-relaxed text-slate-200">
                  Cada recomendación que te damos está diseñada para ser súper clara, directa y fácil de entender. Sin palabras enrevesadas, ayudándote de verdad a ver cuáles son las opciones de la suerte de siempre.
                </p>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className={`${cardTheme} p-5 space-y-3.5 flex flex-col justify-between border-t-4 border-amber-500 shadow-xl`}>
                <div className="space-y-1.5">
                  <span className="bg-amber-500/15 border border-amber-500/20 text-yellow-400 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest leading-none">
                    📸 PREDICCIÓN VISUAL
                  </span>
                  <h3 className="text-xs font-black uppercase text-white font-sans">RECOMENDADOR DE TRILOGÍAS AI</h3>
                  <p className={`text-[10.5px] leading-normal font-sans ${textMutedTheme}`}>
                    Muestra el motor de cálculo predictivo en acción con los diagramas angulares dinámicos de las trilogías canónicas.
                  </p>
                </div>

                {/* Trilogy prediction diagram image */}
                <div className="relative group overflow-hidden rounded-xl border border-slate-800 bg-black flex items-center justify-center p-1 cursor-zoom-in" onClick={() => setZoomedImage(urlTrilogy)}>
                  <img src={urlTrilogy} alt="Ecuaciones de Trilogías" className="w-full h-auto object-cover rounded-lg group-hover:scale-105 transition-all duration-300 select-none" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <span className="bg-yellow-400 text-black border-2 border-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 shadow comic-shadow-small transform translate-y-2 group-hover:translate-y-0 transition-all font-sans">
                      <Maximize2 size={11} /> AMPLIAR DIAGRAMA
                    </span>
                  </div>
                </div>

                <span className="text-[9.5px] text-slate-400 italic font-mono text-center">
                  *Análisis de vecindario físico montado en el layout de casillas
                </span>
              </div>
            </div>
          </>
        )}

        {/* TAB 4: SIMULADOR DE FLUJO */}
        {manualTab === "simulation" && (
          <>
            <div className="lg:col-span-12 flex flex-col gap-4 animate-fadeIn">
              <div className={`${cardTheme} p-6 space-y-5 shadow-xl border-t-4 border-rose-500 relative overflow-hidden`}>
                <div className="absolute top-0 right-0 p-4 opacity-[0.02] text-rose-500 pointer-events-none select-none">
                  <Video size={120} />
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-rose-500/10 pb-4">
                  <div className="space-y-1">
                    <span className="bg-rose-500/15 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded text-[8.5px] font-black uppercase font-mono tracking-widest leading-none bg-rose-950/20 inline-block">
                      🎬 VIDEO-SIMULACIÓN INTERACTIVA DE FLUJO v3.5
                    </span>
                    <h2 className="text-xl font-black uppercase text-white font-sans">
                      RECORRIDO VISUAL: ¿CÓMO VIAJA LA INFORMACIÓN?
                    </h2>
                    <p className={`text-[11px] font-sans ${textMutedTheme}`}>
                      Presiona el botón de reproducción o avanza manualmente para ver un mapa dinámico paso a paso sobre cómo entra la información venezolana y qué hace la app con ella.
                    </p>
                  </div>

                  {/* Playback Controls */}
                  <div className="flex items-center gap-2 bg-[#090b11] p-1.5 rounded-xl border border-slate-800 shrink-0 select-none">
                    <button
                      onClick={() => {
                        playSound("click");
                        setSimStep((prev) => (prev - 1 + 5) % 5);
                      }}
                      className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Paso Anterior"
                    >
                      <ArrowLeft size={14} />
                    </button>

                    <button
                      onClick={() => {
                        playSound("click");
                        setSimPlaying(!simPlaying);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all cursor-pointer select-none ${
                        simPlaying
                          ? "bg-amber-500 text-black border border-amber-600 font-bold"
                          : "bg-rose-500 text-white border border-rose-600 font-bold"
                      }`}
                    >
                      {simPlaying ? (
                        <>
                          <Pause size={10} className="fill-current" /> PAUSAR REPRODUCCIÓN
                        </>
                      ) : (
                        <>
                          <Play size={10} className="fill-current" /> REPRODUCIR AUTO
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        playSound("click");
                        setSimStep((prev) => (prev + 1) % 5);
                      }}
                      className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Siguiente Paso"
                    >
                      <ArrowRight size={14} />
                    </button>

                    <button
                      onClick={() => {
                        playSound("click");
                        setSimStep(0);
                        setSimPlaying(false);
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors text-[9px] font-black cursor-pointer"
                      title="Reiniciar"
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>
                </div>

                {/* Video Player Display Screen */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5.5 items-stretch">
                  {/* Monitor Viewport */}
                  <div className="lg:col-span-8 flex flex-col">
                    <div className="bg-[#05060b] rounded-2xl border-4 border-black relative overflow-hidden flex-1 min-h-[350px] flex flex-col justify-between p-5 shadow-inner">
                      {/* CRT TV Filter Scanline Overlays */}
                      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] pointer-events-none z-10" />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#ffffff01] to-[#ffffff04] pointer-events-none z-10" />

                      {/* Top frame telemetry details */}
                      <div className="flex justify-between items-center border-b border-rose-500/25 pb-2 z-10">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[8px] font-black font-mono text-rose-400 tracking-widest uppercase">
                            CONECTOR_TELEMETRÍA: PASO {simStep + 1} de 5
                          </span>
                        </div>
                        <div className="text-[8px] font-mono text-slate-500">
                          FPS: 60 | BUFFER_OK | MODO: {simPlaying ? "WALKTHROUGH_AUTO" : "INTERACTIVE_PAUSE"}
                        </div>
                      </div>

                      {/* Main Animated Viewport Contents depending on step */}
                      <div className="flex-1 flex flex-col justify-center py-6 z-10 relative">
                        {/* Paso 1: Python Scraper */}
                        {simStep === 0 && (
                          <div className="space-y-4 animate-scaleUp">
                            <div className="text-center space-y-1">
                              <span className="text-3xl">📡</span>
                              <h3 className="text-xs font-black uppercase text-rose-400 font-mono">Paso 1: Extracción Automatizada (Real-Time Scraper)</h3>
                              <p className="text-[10px] text-slate-400 max-w-lg mx-auto">
                                Un extractor síncrono optimizado conecta con los servidores de resultados autorizados de la lotería cada hora.
                              </p>
                            </div>

                            {/* Code terminal simulator */}
                            <div className="bg-[#0b0d16] border border-slate-800 rounded-lg p-3 font-mono text-[9px] text-emerald-400 shadow-md">
                              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-1.5 mb-2">
                                <Terminal size={11} className="text-slate-500" />
                                <span className="text-slate-500 uppercase text-[8px] font-bold">scraper_engine.py &gt; consola de conexión</span>
                              </div>
                              <div className="space-y-1 select-all">
                                <div className="text-slate-400 font-bold">&gt;&gt;&gt; import requests, json, bs4</div>
                                <div>&gt;&gt;&gt; URL = "https://www.lotoactivo.com/resultados/"</div>
                                <div><span className="text-yellow-400">&gt;&gt;&gt; [REQUEST]</span> Conectando con servidor oficial (Loto Activo)... 200 OK</div>
                                <div><span className="text-blue-400">&gt;&gt;&gt; [EXTRACCIÓN]</span> Identificando bloque de hoy: animalito <span className="text-pink-400 font-bold">05 LEÓN</span> extraído con éxito.</div>
                                <div className="text-rose-500 font-bold animate-pulse">&gt;&gt;&gt; [STREAM] Enviando payload a conector local...</div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Paso 2: Proxy Tunnel */}
                        {simStep === 1 && (
                          <div className="space-y-4 animate-scaleUp">
                            <div className="text-center space-y-1">
                              <span className="text-3xl">🛡️</span>
                              <h3 className="text-xs font-black uppercase text-blue-400 font-mono">Paso 2: Filtro de Proxy Seguro</h3>
                              <p className="text-[10px] text-slate-400 max-w-lg mx-auto">
                                La petición es ruteada de forma segura para prevenir bloqueos regionales o fallas de red, proveyendo inmunidad ante caídas.
                              </p>
                            </div>

                            {/* Graphical Node representation */}
                            <div className="flex items-center justify-center gap-4 py-2 select-none">
                              <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-center shrink-0">
                                <span className="text-[8px] font-mono text-slate-500 uppercase block">ORÍGEN</span>
                                <strong className="text-slate-300 text-[10px] uppercase font-bold">Web Loto</strong>
                              </div>
                              <div className="flex-1 max-w-[80px] h-0.5 bg-gradient-to-r from-blue-500 to-[#e21d5a] relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 absolute top-[-3px] left-0 animate-pulse" />
                              </div>
                              <div className="bg-[#121320] border-2 border-rose-500/40 p-2.5 rounded-xl text-center shadow shadow-rose-500/10 shrink-0">
                                <span className="text-[8px] font-mono text-rose-400 uppercase block tracking-wider animate-pulse">PROXYS_VITE_INMUNE</span>
                                <strong className="text-white text-[10.5px] uppercase font-black">Validación SSl</strong>
                              </div>
                              <div className="flex-1 max-w-[80px] h-0.5 bg-gradient-to-r from-[#e21d5a] to-emerald-500 relative">
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 absolute top-[-3px] left-0 animate-pulse" />
                              </div>
                              <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-center shrink-0">
                                <span className="text-[8px] font-mono text-slate-500 uppercase block">DESTINO</span>
                                <strong className="text-emerald-400 text-[10px] uppercase font-bold">App Browser</strong>
                              </div>
                            </div>

                            <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-center text-[9.5px] text-slate-400 leading-normal max-w-sm mx-auto font-mono">
                              STATUS: <span className="text-emerald-400 font-bold">ACTIVE_PROX_SECURE</span> | SEGURIDAD: 100% INMUNE
                            </div>
                          </div>
                        )}

                        {/* Paso 3: React distribution */}
                        {simStep === 2 && (
                          <div className="space-y-4 animate-scaleUp">
                            <div className="text-center space-y-1">
                              <span className="text-3xl">📊</span>
                              <h3 className="text-xs font-black uppercase text-emerald-400 font-mono">Paso 3: Distribución Síncrona a la Grid</h3>
                              <p className="text-[10px] text-slate-400 max-w-lg mx-auto">
                                La información se divide en casillas horarias con sus respectivos códigos numéricos asignando emojis en el acto.
                              </p>
                            </div>

                            {/* Mock grid cards loading anim */}
                            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
                              {[
                                { h: "09:00 AM", r: "28 ZAMURO 🦅", active: false },
                                { h: "10:00 AM", r: "05 LEÓN 🦁", active: true },
                                { h: "11:00 AM", r: "14 PALOMA 🕊️", active: false },
                                { h: "12:00 PM", r: "Sorteando...", active: false, pulse: true }
                              ].map((mock, idx) => (
                                <div key={idx} className={`p-2 rounded-lg border text-center font-mono ${
                                  mock.active
                                    ? "bg-rose-500/20 border-rose-500 text-white animate-pulse"
                                    : mock.pulse
                                      ? "bg-[#111222]/50 border-slate-800 text-slate-500 border-dashed animate-pulse"
                                      : "bg-[#0b0d15] border-slate-800 text-slate-400"
                                }`}>
                                  <div className="text-[7.5px] font-bold text-slate-500">{mock.h}</div>
                                  <div className="text-[9px] font-black uppercase mt-1 text-slate-200">{mock.r}</div>
                                  {mock.active && <span className="block text-[6.5px] text-rose-400 font-black tracking-widest mt-0.5 font-sans uppercase">ACTUALIZADO</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Paso 4: AI Model */}
                        {simStep === 3 && (
                          <div className="space-y-4 animate-scaleUp">
                            <div className="text-center space-y-1">
                              <span className="text-3xl">🧠</span>
                              <h3 className="text-sm font-black uppercase text-purple-400 font-sans">Paso 4: Buscando Compañeros de la Suerte Inteligentes</h3>
                              <p className="text-xs text-slate-300 max-w-lg mx-auto leading-relaxed">
                                Nuestro sistema inteligente encuentra los tres animalitos recomendados que mejor combinan y tienen más racha de salir juntos en los próximos sorteos.
                              </p>
                            </div>

                            {/* Brain calculating mockup */}
                            <div className="flex flex-col items-center gap-2">
                              <div className="relative w-12 h-12 bg-purple-950/20 rounded-full border border-purple-500/40 flex items-center justify-center">
                                <Sparkles className="text-purple-400" size={24} />
                              </div>
                              <div className="text-center font-sans text-xs text-purple-300">
                                Buscando compañeros para León en la rueda...
                                <div className="flex gap-1.5 justify-center mt-2.5">
                                  <span className="bg-purple-900/40 px-2.5 py-1 rounded border border-purple-800 text-purple-200 text-xs font-bold uppercase">Pareja de siempre: 32 ARDILLA 🐿️</span>
                                  <span className="bg-purple-900/40 px-2.5 py-1 rounded border border-purple-800 text-purple-200 text-xs font-bold uppercase">Compañero ideal: 04 ALACRÁN 🦂</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Paso 5: LocalStorage */}
                        {simStep === 4 && (
                          <div className="space-y-4 animate-scaleUp">
                            <div className="text-center space-y-1">
                              <span className="text-3xl">💾</span>
                              <h3 className="text-xs font-black uppercase text-amber-400 font-mono">Paso 5: Resguardo, Respaldo Local & Descargas</h3>
                              <p className="text-[10px] text-slate-400 max-w-lg mx-auto">
                                Los datos del día están guardados en tu dispositivo local inmediatamente. Puedes exportarlos en copia de seguridad JSON cuando desees.
                              </p>
                            </div>

                            {/* Download representation */}
                            <div className="flex items-center justify-center gap-3 bg-slate-900/50 max-w-xs mx-auto p-3 rounded-xl border border-dashed border-amber-500/30">
                              <div className="p-2 bg-amber-500/15 text-amber-400 rounded-lg">
                                <FileText size={24} />
                              </div>
                              <div className="text-left font-mono">
                                <strong className="text-xs text-white uppercase block">backup-ruleta.json</strong>
                                <span className="text-[8.5px] text-slate-400 font-sans">Estructura limpia síncrona encriptada</span>
                              </div>
                              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono tracking-widest animate-pulse ml-auto shrink-0">
                                LISTO
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom visual seek bar */}
                      <div className="space-y-1.5 z-10 select-none">
                        <div className="flex justify-between items-center text-[8.5px] font-mono text-slate-400">
                          <span className="uppercase">Fase de Simulación: {
                            simStep === 0 ? "Fase 1: Extractor Python" :
                            simStep === 1 ? "Fase 2: Túnel de Proxy" :
                            simStep === 2 ? "Fase 3: React Core Layout" :
                            simStep === 3 ? "Fase 4: Algoritmo Trilogías" :
                            "Fase 5: Persistencia Local"
                          }</span>
                          <span>Paso {simStep + 1} de 5</span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-2 bg-[#0d0f17] border border-slate-100/10 rounded-full overflow-hidden relative">
                          <div
                            className="h-full bg-rose-500 transition-all duration-300"
                            style={{ width: `${((simStep + 1) / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Step Explanation Side Panel */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-[#090b11] border border-slate-800 rounded-2xl p-4.5 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📋</span>
                          <h4 className="text-xs font-black uppercase text-white font-sans tracking-wide">
                            DESCRIPCIÓN DEL PROCESAMIENTO
                          </h4>
                        </div>

                        {/* Descriptive list dynamic per step */}
                        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed font-sans border-t border-slate-800/60 pt-3">
                          {simStep === 0 && (
                            <>
                              <p>
                                El conector <strong>Python (Scraperia.py)</strong> corre cada hora. No requiere autenticaciones complejas; realiza una simple llamada HTTPS optimizada para traer el dato crudo en milisegundos de forma totalmente inmune a fallas.
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Este dato es pre-procesado para evitar errores de codificación antes de ser enviado a la interfaz del usuario de manera invisible.
                              </p>
                            </>
                          )}
                          {simStep === 1 && (
                            <>
                              <p>
                                El navegador de tu computador solicita la actualización de resultados de loterías. Para evitar bloqueos regionales o bloqueos por exceso de peticiones, la información pasa descifrada por nuestro <strong>Proxy Sólido VITE</strong>.
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Esto garantiza una disponibilidad constante de los sorteos incluso en horas pico de alta demanda o saturaciones de red externas.
                              </p>
                            </>
                          )}
                          {simStep === 2 && (
                            <>
                              <p>
                                El estado global de React recolecta el JSON de entrada. Si notas que una casilla faltaba, y tú la asignas manualmente mediante clic en la cuadrícula o subiendo un archivo, la red síncrona distribuye el nuevo valor a todas las vistas de forma inmediata.
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Esto evita que tengas que cargar el mismo resultado dos veces en diferentes paneles de la app, optimizando pantallas táctiles.
                              </p>
                            </>
                          )}
                          {simStep === 3 && (
                            <>
                              <p>
                                El cerebro analítico local toma los resultados cargados en la base de datos de juego actual y examina retrospectivamente los patrones de arrastre de la rueda física de 37 casillas.
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Al detectar relaciones de adyacencia angular física (vecinos de la rueda) y repetición estacional, despliega las dos escoltas con más alta coincidencia predictiva.
                              </p>
                            </>
                          )}
                          {simStep === 4 && (
                            <>
                              <p>
                                Al estar toda su integridad respaldada en tu navegador via <strong>LocalStorage</strong>, tienes inmunidad ante caídas de alojamiento. Incluso con la app desconectada a internet de soporte exterior la data persiste.
                              </p>
                              <p className="text-[11px] text-slate-400 leading-relaxed">
                                Usa los botones de respaldar a dispositivo local de forma libre para intercambiar plantillas completas de registros históricos con otros usuarios.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* User action button */}
                      <div className="pt-4 border-t border-slate-800">
                        <button
                          onClick={() => {
                            playSound("click");
                            setSimStep((prev) => (prev + 1) % 5);
                          }}
                          className="w-full py-2.5 bg-rose-500 hover:bg-rose-450 border border-black text-white font-black text-[10px] uppercase rounded-xl tracking-wider cursor-pointer comic-shadow-small transition-all font-sans text-center flex items-center justify-center gap-1.5"
                        >
                          <span>VER SIGUIENTE FASE ({simStep === 4 ? "Paso 1" : `Paso ${simStep + 2}`})</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* FULLSCREEN ZOOM MODAL OVERLAY FOR USER MANUAL IMAGES */}
      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[1000] flex flex-col items-center justify-center p-4 animate-fadeIn" onClick={() => setZoomedImage(null)}>
            {/* Close instruction label */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 flex items-center gap-2">
              <span className="bg-red-500 border border-black text-white px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider font-sans shadow comic-shadow-small cursor-pointer" onClick={() => setZoomedImage(null)}>
                ✕ CERRAR
              </span>
            </div>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center bg-[#0d0f17] rounded-3xl border-4 border-black p-2 md:p-4 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Halftone dot texture */}
              <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

              <img src={zoomedImage} alt="Diagrama de Guía Ampliado" className="w-full h-full object-contain rounded-2xl select-all select-none" />
            </motion.div>

            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-4 font-mono select-none">
              Haz clic fuera de la imagen para regresar al manual de usuario
            </span>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

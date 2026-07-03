import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Brain,
  HelpCircle
} from "lucide-react";
import { ANIMALITOS } from "../../data/animalitos";
import { computeComprehensiveOracle } from "../../utils/predictionEngine";
import { OraclePredictor } from "./OraclePredictor";
import { AuditorDeAciertosIA } from "./AuditorDeAciertosIA";

interface OracleTabProps {
  darkMode: boolean;
  cardTheme: string;
  textMutedTheme: string;
  inputTheme: string;
  draws: Record<string, string>;
  accumulatedResults: any[];
  fecha: string;
  loteria: string;
  hoursList: string[];
  playSound: (soundName: string) => void;
  trafficLightColors?: Record<string, "gray" | "green" | "yellow" | "red">;
  onCycleTrafficLight?: (code: string, e?: React.MouseEvent) => void;
}

export function OracleTab({
  darkMode,
  cardTheme,
  textMutedTheme,
  inputTheme,
  draws,
  accumulatedResults,
  fecha,
  loteria,
  hoursList,
  playSound,
  trafficLightColors,
  onCycleTrafficLight
}: OracleTabProps) {
  const [selectedHour, setSelectedHour] = useState<string>("08:00 AM");
  const [showAuditor, setShowAuditor] = useState<boolean>(true);
  const [animalsCount, setAnimalsCount] = useState<number>(2); // Default to 2, exactly as the user wanted

  // Compute Oracle results for ALL hours of the day to show in the master grid
  const hourlyOracleData = useMemo(() => {
    const results: Record<string, any> = {};
    for (const h of hoursList) {
      try {
        results[h] = computeComprehensiveOracle(accumulatedResults, draws, loteria, h, hoursList, false, fecha);
      } catch (e) {
        console.error(`Error computing oracle for ${h}:`, e);
        results[h] = null;
      }
    }
    return results;
  }, [accumulatedResults, draws, loteria, hoursList, fecha]);

  const selectedOracle = hourlyOracleData[selectedHour] || null;

  // Custom text colors based on dark mode
  const titleColor = darkMode ? "text-purple-400" : "text-purple-800";
  const descColor = darkMode ? "text-slate-300" : "text-slate-700";

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Tab Banner / Header */}
      <div className={`${cardTheme} p-6 flex flex-col lg:flex-row gap-5 justify-between lg:items-center relative overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-indigo-500/5 pointer-events-none" />
        <div className="max-w-xl z-10">
          <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-purple-400 mb-1.5 flex items-center gap-2 leading-none">
            <Brain className="text-purple-400 animate-pulse" size={20} />
            <span>ORÁCULO INTELIGENTE IA (CÁLCULO Y PREDICCIONES POR HORA)</span>
          </h3>
          <p className={`text-xs md:text-sm leading-relaxed font-sans ${textMutedTheme}`}>
            Esta sección computa en tiempo real las probabilidades probabilísticas para <strong>cada una de las 12 horas del día</strong>. 
            Utiliza análisis recursivo de cadenas de Markov, estimación bayesiana con factor de decaimiento temporal y distribución de Poisson sobre el histórico acumulado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 z-10">
          {/* Selector de cantidad de animales */}
          <div className={`flex items-center rounded-xl p-1 border ${
            darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-250"
          }`}>
            <button
              onClick={() => {
                playSound("click");
                setAnimalsCount(2);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                animalsCount === 2
                  ? "bg-purple-600 text-white shadow-sm"
                  : darkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              ✌️ 2 Animales (Antes)
            </button>
            <button
              onClick={() => {
                playSound("click");
                setAnimalsCount(3);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                animalsCount === 3
                  ? "bg-purple-600 text-white shadow-sm"
                  : darkMode
                    ? "text-slate-400 hover:text-slate-200"
                    : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🤟 3 Animales
            </button>
          </div>

          <button
            onClick={() => {
              playSound("click");
              setShowAuditor(!showAuditor);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${
              showAuditor
                ? darkMode
                  ? "bg-purple-950/40 text-purple-300 border-purple-500/40 shadow-md"
                  : "bg-purple-100 text-purple-800 border-purple-300 shadow-sm"
                : darkMode
                  ? "bg-slate-900/40 text-slate-400 border-slate-800"
                  : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <span>📊</span>
            <span>{showAuditor ? "Ocultar Auditor" : "Ver Auditor de Aciertos"}</span>
          </button>
        </div>
      </div>

      {/* Auditor de Aciertos IA */}
      {showAuditor && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full"
        >
          <AuditorDeAciertosIA 
            accumulatedResults={accumulatedResults}
            loteria={loteria}
            darkMode={darkMode}
            animalsCount={animalsCount}
          />
        </motion.div>
      )}

      {/* Grid de 12 Horas - Sincronía Temporal de Predicciones */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock size={14} className="text-purple-400" />
            <span>Sincronía Temporal: Estado del Oráculo en las 12 Horas de Hoy ({loteria})</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-500 font-bold uppercase select-none">Haga clic en una hora para ver su desglose matemático</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {hoursList.map((hour) => {
            const data = hourlyOracleData[hour];
            const drawsCode = draws[hour];
            const isDrawn = !!drawsCode;
            const isSelected = selectedHour === hour;

            // Get Top predictions for this hour
            const topN = data?.monteCarlo?.probabilityCloud?.slice(0, animalsCount) || [];
            const isHit = isDrawn && topN.some((p: any) => p.code === drawsCode);
            const isBackupHit = isDrawn && !isHit && data?.monteCarlo?.probabilityCloud?.slice(animalsCount, 8).some((p: any) => p.code === drawsCode);

            const animalMeta = isDrawn ? ANIMALITOS[drawsCode] : null;

            // Dynamic Styling Themes for Acrylic Plaques
            let borderTheme = darkMode ? "border-slate-800/80" : "border-slate-300";
            let bgTheme = darkMode ? "bg-slate-900/40 backdrop-blur-md" : "bg-white/80 backdrop-blur-md";
            let leftLineColor = "bg-slate-400";
            let glowShadow = "";

            if (isSelected) {
              borderTheme = "border-amber-400 dark:border-amber-400";
              bgTheme = "bg-[#FFDE4D] text-slate-950 shadow-lg scale-[1.01]";
              leftLineColor = "bg-slate-950";
              glowShadow = "shadow-[0_0_20px_rgba(251,191,36,0.45)]";
            } else if (isHit) {
              borderTheme = darkMode ? "border-emerald-500/40" : "border-emerald-400";
              bgTheme = darkMode ? "bg-gradient-to-br from-emerald-950/30 via-emerald-900/5 to-slate-950/50" : "bg-gradient-to-br from-emerald-50 via-emerald-100/30 to-white";
              leftLineColor = "bg-emerald-500";
              glowShadow = "shadow-[0_0_15px_rgba(16,185,129,0.1)]";
            } else if (isBackupHit) {
              borderTheme = darkMode ? "border-blue-500/40" : "border-blue-400";
              bgTheme = darkMode ? "bg-gradient-to-br from-blue-950/30 via-blue-900/5 to-slate-950/50" : "bg-gradient-to-br from-blue-50 via-blue-100/30 to-white";
              leftLineColor = "bg-blue-500";
              glowShadow = "shadow-[0_0_15px_rgba(59,130,246,0.1)]";
            }

            return (
              <motion.div
                key={hour}
                whileHover={{ scale: 1.025 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  playSound("click");
                  setSelectedHour(hour);
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${borderTheme} ${bgTheme} ${glowShadow}`}
              >
                {/* Glossy reflection overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-40" />
                
                {/* Accent side bar */}
                <div className={`absolute top-0 left-0 bottom-0 w-[4px] ${leftLineColor}`} />

                {/* Header: Hour and Status */}
                <div className="flex justify-between items-center mb-3.5 pl-1.5 z-10">
                  <span className={`font-mono text-xs font-black ${isSelected ? "text-slate-950" : darkMode ? "text-slate-100" : "text-slate-900"}`}>{hour}</span>
                  {isDrawn ? (
                    isHit ? (
                      <span className={`border text-[8px] font-black font-mono px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                        isSelected 
                          ? "bg-emerald-900/25 text-emerald-950 border-emerald-900/30" 
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        🎯 Acierto IA
                      </span>
                    ) : isBackupHit ? (
                      <span className={`border text-[8px] font-black font-mono px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                        isSelected 
                          ? "bg-blue-900/25 text-blue-950 border-blue-900/30" 
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}>
                        🛡️ Respaldo
                      </span>
                    ) : (
                      <span className={`border text-[8px] font-black font-mono px-2 py-0.5 rounded-lg uppercase tracking-wider ${
                        isSelected 
                          ? "bg-slate-900/10 text-slate-850 border-slate-900/20" 
                          : darkMode ? "bg-slate-850 text-slate-400 border-slate-750" : "bg-slate-100 text-slate-650 border-slate-200"
                      }`}>
                        Evaluado
                      </span>
                    )
                  ) : (
                    <span className={`border text-[8px] font-black font-mono px-2 py-0.5 rounded-lg uppercase tracking-wider animate-pulse ${
                      isSelected 
                        ? "bg-amber-950/20 text-amber-950 border-amber-950/30" 
                        : "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                    }`}>
                      🔮 Pendiente
                    </span>
                  )}
                </div>

                {/* Drawn animalito if already happened */}
                <div className="pl-1.5 mb-3.5 z-10">
                  {isDrawn ? (
                    <div className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                      isSelected
                        ? "bg-white/40 border-amber-500/30 text-slate-950"
                        : darkMode ? "bg-black/35 border-slate-800/80" : "bg-slate-100/60 border-slate-200/80"
                    }`}>
                      <span className="text-2.5xl filter drop-shadow leading-none shrink-0">{animalMeta?.emoji}</span>
                      <div className="leading-tight truncate">
                        <span className={`text-[10px] font-mono font-black ${isSelected ? "text-slate-950" : darkMode ? "text-amber-400" : "text-amber-700"}`}>[{drawsCode}]</span>
                        <span className={`text-[10px] font-black uppercase ml-1 truncate block ${isSelected ? "text-slate-950" : darkMode ? "text-slate-100" : "text-slate-900"}`}>{animalMeta?.name}</span>
                      </div>
                    </div>
                  ) : (
                    <div className={`h-11 border border-dashed rounded-xl flex items-center justify-center text-[9px] font-mono font-bold uppercase ${
                      isSelected
                        ? "border-amber-650 bg-amber-500/10 text-amber-950"
                        : darkMode ? "border-slate-800 bg-black/15 text-slate-500" : "border-slate-300 bg-slate-50/50 text-slate-450"
                    }`}>
                      Sin Sorteo Aún
                    </div>
                  )}
                </div>

                {/* Top predictions listing */}
                <div className="space-y-1.5 pl-1.5 mt-auto z-10">
                  <span className={`text-[8px] font-black uppercase tracking-widest block font-mono ${isSelected ? "text-slate-800" : darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    TOP {animalsCount} ORÁCULO IA:
                  </span>
                  {topN.length === 0 ? (
                    <span className="text-[9px] text-slate-500 italic block font-mono">Sin predicciones</span>
                  ) : (
                    <div className="space-y-1">
                      {topN.map((pred: any) => {
                        const isThisWinner = isDrawn && pred.code === drawsCode;
                        return (
                          <div 
                            key={pred.code} 
                            className={`flex items-center justify-between text-[10px] p-1.5 rounded-xl border transition-all ${
                              isThisWinner
                                ? isSelected
                                  ? "bg-emerald-600/35 border-emerald-600/40 text-emerald-950 font-extrabold"
                                  : "bg-emerald-500/20 border-emerald-500/35 text-emerald-400 font-extrabold"
                                : isSelected
                                  ? "bg-white/45 border-amber-300 hover:bg-white/60 text-slate-950 font-bold"
                                  : darkMode
                                    ? "bg-slate-950/40 border-slate-850 hover:bg-slate-950/60 text-slate-300"
                                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm shrink-0 leading-none">{pred.emoji}</span>
                              <span className={`font-mono font-black shrink-0 ${isThisWinner ? (isSelected ? "text-emerald-950" : "text-emerald-400") : (isSelected ? "text-slate-950" : "text-amber-600")}`}>{pred.code}</span>
                              <span className={`text-[8.5px] font-extrabold uppercase truncate ml-0.5 ${
                                isThisWinner 
                                  ? isSelected ? "text-emerald-900" : "text-emerald-300" 
                                  : isSelected ? "text-slate-800" : darkMode ? "text-slate-300" : "text-slate-700"
                              }`}>{pred.name}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`font-mono text-[9px] font-black shrink-0 ${isThisWinner ? (isSelected ? "text-emerald-950" : "text-emerald-400") : (isSelected ? "text-slate-900" : "text-amber-500")}`}>
                                {pred.percentage.toFixed(0)}%
                              </span>
                              
                              {/* 🚦 Semáforo Interactive Dot inside Oracle */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onCycleTrafficLight) onCycleTrafficLight(pred.code, e);
                                }}
                                className={`w-3.5 h-3.5 rounded-full border shadow-sm cursor-pointer hover:scale-125 transition-all flex items-center justify-center shrink-0 ${
                                  trafficLightColors?.[pred.code] === "green"
                                    ? "bg-emerald-500 border-emerald-400 shadow-[0_0_5px_rgba(16,185,129,0.3)]"
                                    : trafficLightColors?.[pred.code] === "yellow"
                                      ? "bg-amber-400 border-amber-300 shadow-[0_0_5px_rgba(251,191,36,0.3)]"
                                      : trafficLightColors?.[pred.code] === "red"
                                        ? "bg-rose-500 border-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.3)]"
                                        : "bg-slate-500/30 border-slate-400/30"
                                }`}
                                title="Semáforo: Haz clic para cambiar color"
                              >
                                {(!trafficLightColors?.[pred.code] || trafficLightColors?.[pred.code] === "gray") && (
                                  <span className="w-1 h-1 rounded-full bg-slate-300/60" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Selected Hour Details Breakdowns */}
      <div className="grid grid-cols-1 gap-6">
        <div className="border-t border-slate-800/40 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-2">
                <Sparkles size={14} className="text-purple-400 animate-pulse" />
                <span>Análisis Matemático Detallado para la Hora: {selectedHour}</span>
              </h4>
              <p className={`text-[11px] leading-tight font-sans ${textMutedTheme} mt-0.5`}>
                Desglose probabilístico de Poisson, Bayes, Markov y simulaciones de Monte Carlo para la hora seleccionada.
              </p>
            </div>
            <span className="bg-slate-950/60 border border-slate-850 py-1.5 px-3 rounded-full text-xs font-mono font-black text-purple-300 self-start sm:self-auto uppercase">
              ⏳ Sorteo: {selectedHour}
            </span>
          </div>

          <OraclePredictor
            oracleData={selectedOracle}
            selectedHour={selectedHour}
            darkMode={darkMode}
            isFuture={!draws[selectedHour]}
            animalsCount={animalsCount}
            trafficLightColors={trafficLightColors}
            onCycleTrafficLight={onCycleTrafficLight}
          />
        </div>
      </div>
    </div>
  );
}

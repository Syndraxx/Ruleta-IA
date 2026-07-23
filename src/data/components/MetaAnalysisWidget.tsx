import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  TrendingUp, 
  Award, 
  Repeat, 
  RotateCw, 
  Layers, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  History, 
  Zap, 
  AlertCircle
} from "lucide-react";
import { AccumulatedResult, DailyReport } from "../../types";
import { HOURS_LIST } from "../../constants";
import { 
  analyzeDayPredictions, 
  getSavedMetaAnalysisHistory, 
  saveMetaAnalysisToHistory,
  clearMetaAnalysisHistory,
  DayMetaAnalysis
} from "../../core/engines/metaAnalyzer";
import { generateDailyReport } from "../../utils/predictionEngine";
import { ANIMALITOS } from "../animalitos";



interface MetaAnalysisWidgetProps {
  accumulatedResults: AccumulatedResult[];
  draws: Record<string, string | null>;
  fecha: string;
  loteria: string;
  darkMode: boolean;
  playSound: (soundName: string) => void;
}

export const MetaAnalysisWidget: React.FC<MetaAnalysisWidgetProps> = ({
  accumulatedResults,
  draws,
  fecha,
  loteria,
  darkMode,
  playSound,
}) => {
  const [animalsCount, setAnimalsCount] = useState<number>(3);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [savedHistory, setSavedHistory] = useState<Record<string, DayMetaAnalysis>>({});

  // 1. Reconstruir el objeto de registro para el día de hoy
  const currentDayRecord = useMemo<AccumulatedResult>(() => {
    // Normalizar draws a string | null para cumplir con DrawsRecord
    const normalizedDraws: Record<string, string | null> = {};
    HOURS_LIST.forEach((h) => {
      normalizedDraws[h] = draws[h] || null;
    });

    return {
      loteria,
      fecha,
      scrapedSource: "En tiempo real (Meta-Auditoría)",
      draws: normalizedDraws,
      count: Object.values(normalizedDraws).filter(Boolean).length,
      extractedAt: new Date().toISOString()
    };
  }, [draws, loteria, fecha]);

  // 2. Calcular el Meta-Análisis del día de hoy
  const currentAnalysis = useMemo<DayMetaAnalysis>(() => {
    return analyzeDayPredictions(accumulatedResults, currentDayRecord, HOURS_LIST, animalsCount);
  }, [accumulatedResults, currentDayRecord, animalsCount]);

  // 2.5. Generar el Reporte Diario detallado oficial para el Contexto Diario Estricto
  const currentDailyReport = useMemo<DailyReport>(() => {
    return generateDailyReport(accumulatedResults, currentDayRecord, HOURS_LIST);
  }, [accumulatedResults, currentDayRecord]);

  // 3. Persistir automáticamente el análisis del día actual cuando cambie o tenga nuevos sorteos

  useEffect(() => {
    if (currentAnalysis && currentAnalysis.totalDraws > 0) {
      saveMetaAnalysisToHistory(currentAnalysis);
      // Recargar historial guardado
      setSavedHistory(getSavedMetaAnalysisHistory());
    }
  }, [currentAnalysis]);

  // 4. Cargar historial inicial de localStorage
  useEffect(() => {
    setSavedHistory(getSavedMetaAnalysisHistory());
  }, []);

  const handleClearHistory = () => {
    playSound("click");
    if (window.confirm("¿Estás seguro de que deseas vaciar el historial de meta-análisis?")) {
      clearMetaAnalysisHistory();
      setSavedHistory({});
    }
  };

  // Ícono de patrón de juego
  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case "Repetición":
        return <Repeat className="text-pink-400 animate-spin-slow" size={24} />;
      case "Rotación":
        return <RotateCw className="text-emerald-400 animate-spin-slow" size={24} />;
      case "Racha":
        return <Zap className="text-amber-400 animate-pulse" size={24} />;
      default:
        return <Layers className="text-sky-400" size={24} />;
    }
  };

  // Color de etiqueta del patrón
  const getPatternBadgeClass = (pattern: string) => {
    switch (pattern) {
      case "Repetición":
        return "bg-pink-500/10 text-pink-300 border-pink-500/20";
      case "Rotación":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
      case "Racha":
        return "bg-amber-500/10 text-amber-300 border-amber-500/20";
      default:
        return "bg-sky-500/10 text-sky-300 border-sky-500/20";
    }
  };

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-300 ${
      darkMode ? "border-slate-800 bg-slate-900/60" : "border-slate-200 bg-slate-50"
    }`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Brain size={18} />
            </span>
            <h2 className={`text-xl font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-slate-900"}`}>
              Capa de Meta-Análisis Predictivo
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Audita el comportamiento dinámico de la ruleta hoy e identifica cuál de los 4 motores matemáticos lidera la precisión.
          </p>
        </div>

        {/* Controles de Calibración de la Meta-Auditoría */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rango de Evaluación:</span>
            <div className={`flex rounded-lg p-0.5 border ${darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
              {[2, 3, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    playSound("click");
                    setAnimalsCount(n);
                  }}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                    animalsCount === n
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Top {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              playSound("click");
              setShowHistory(!showHistory);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
              showHistory
                ? "bg-indigo-600 text-white border-indigo-500"
                : darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <History size={14} />
            <span>{showHistory ? "Ver Análisis de Hoy" : "Historial de Días"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!showHistory ? (
          <motion.div
            key="current-day"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {currentAnalysis.totalDraws === 0 ? (
              <div className={`p-10 text-center rounded-2xl border ${
                darkMode ? "bg-slate-950/40 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"
              }`}>
                <AlertCircle className="mx-auto mb-3 text-indigo-400" size={32} />
                <h3 className="font-black text-sm uppercase text-slate-300 mb-1">Sin datos para analizar hoy</h3>
                <p className="text-xs max-w-md mx-auto">
                  Agrega o extrae por scraping los resultados del día de hoy ({fecha}) en el panel para auditar en vivo la efectividad de cada motor matemático.
                </p>
              </div>
            ) : (
              <>
                {/* Panel Resumen de Patrón de Juego y Líder */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Patrón de Juego */}
                  <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                    darkMode ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                      {getPatternIcon(currentAnalysis.gamePattern)}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">Patrón de Juego Detectado</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-black uppercase border block w-fit mb-2 ${
                        getPatternBadgeClass(currentAnalysis.gamePattern)
                      }`}>
                        {currentAnalysis.gamePattern}
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {currentAnalysis.patternExplanation}
                      </p>
                    </div>
                  </div>

                  {/* Motor Líder de Hoy */}
                  <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                    darkMode ? "bg-slate-950/50 border-slate-800" : "bg-white border-slate-200"
                  }`}>
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 text-amber-400">
                      <Award className="animate-bounce" size={24} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">Motor Líder Hoy</span>
                      <span className="text-lg font-black text-white block mb-0.5">
                        {currentAnalysis.bestEngine === "Ninguno" ? "Ninguno Aún" : `${currentAnalysis.bestEngine}`}
                      </span>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {currentAnalysis.bestEngine !== "Ninguno" 
                          ? `Este motor matemático registra el mayor porcentaje de precisión para los sorteos jugados hoy en ${loteria}. Sus predicciones para las próximas horas tienen prioridad de recomendación.`
                          : "Todavía no se registran aciertos suficientes hoy por ninguno de los motores en el rango de búsqueda configurado."}
                      </p>
                    </div>
                  </div>

                  {/* Eficiencia Global Combinada */}
                  <div className={`p-5 rounded-2xl border flex items-start gap-4 ${
                    darkMode ? "bg-indigo-950/20 border-indigo-500/20" : "bg-indigo-50/50 border-indigo-200/50"
                  }`}>
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Activity size={24} />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">Efectividad Colectiva</span>
                      <div className="flex items-baseline gap-1.5 mb-1">
                        <span className="text-2xl font-black text-indigo-400">
                          {((currentAnalysis.performances.reduce((acc, p) => acc + p.hits, 0) / (currentAnalysis.totalDraws * 4)) * 100).toFixed(1)}%
                        </span>
                        <span className="text-xs text-slate-400">tasa global</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Evaluando la asertividad acumulada de todos los motores probabilísticos cruzados hoy. Muestra: {currentAnalysis.totalDraws} sorteos de {HOURS_LIST.length} posibles.
                      </p>
                    </div>
                  </div>
                </div>

                {/* STRICT DAILY SUMMARY CONTEXT CARD */}
                <div className={`p-6 rounded-2xl border ${
                  darkMode ? "bg-gradient-to-br from-indigo-950/20 to-slate-950/40 border-indigo-500/20" : "bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200"
                }`}>
                  <div className="flex items-center gap-2 mb-4 border-b border-indigo-500/10 pb-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? "text-indigo-400" : "text-indigo-800"}`}>
                        Resumen Diario de Auditoría ({fecha})
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                        Contexto Diario Estricto - {loteria}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Animalitos más repetidos */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        🔥 Animales Más Repetidos Hoy
                      </h4>
                      {currentDailyReport.topAnimals.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No hay registros hoy</p>
                      ) : (
                        <div className="space-y-1.5">
                          {currentDailyReport.topAnimals.slice(0, 4).map((anim, idx) => (
                            <div 
                              key={anim.code}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold border ${
                                idx === 0 
                                  ? darkMode 
                                    ? "bg-amber-950/20 border-amber-500/30 text-amber-300"
                                    : "bg-amber-50 border-amber-200 text-amber-800"
                                  : darkMode 
                                    ? "bg-slate-900/40 border-slate-800/60 text-slate-300"
                                    : "bg-slate-100/50 border-slate-200 text-slate-750"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{anim.emoji}</span>
                                <span>{anim.name}</span>
                                <span className="text-[10px] font-mono text-slate-500">#{anim.code}</span>
                              </div>
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950/40 text-slate-400 border border-slate-800">
                                {anim.count} {anim.count === 1 ? "vez" : "veces"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Desempeño de Motores hoy */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                        🎯 Motores en Acción Hoy
                      </h4>
                      <div className="space-y-1.5">
                        {currentDailyReport.engineAccuracies.map((acc) => {
                          const isBest = acc.engine === currentDailyReport.bestEngine;
                          return (
                            <div 
                              key={acc.engine}
                              className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                                isBest
                                  ? darkMode 
                                    ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300 font-black"
                                    : "bg-emerald-50 border-emerald-200 text-emerald-800 font-black"
                                  : darkMode 
                                    ? "bg-slate-900/40 border-slate-800/60 text-slate-400"
                                    : "bg-slate-100/50 border-slate-200 text-slate-650"
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                {isBest ? "👑" : "⚙️"}
                                <span>Motor {acc.engine}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono">{acc.hits}/{acc.total}</span>
                                <span className={`px-1.5 py-0.5 rounded font-black font-mono text-[10px] ${
                                  isBest 
                                    ? "bg-emerald-500/10 text-emerald-400" 
                                    : "bg-slate-950/20 text-slate-500"
                                }`}>
                                  {acc.accuracy.toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Patrón de Juego */}
                    <div className="flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                          🧠 Patrón & Auditoría de IA
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase border ${
                              getPatternBadgeClass(currentDailyReport.gamePattern)
                            }`}>
                              {currentDailyReport.gamePattern}
                            </span>
                            <span className="text-[10px] font-bold text-slate-450 uppercase">Patrón Dominante</span>
                          </div>
                          <p className={`text-xs leading-relaxed italic p-3 rounded-xl border ${
                            darkMode ? "bg-slate-950/20 text-slate-400 border-slate-900" : "bg-white text-slate-600 border-slate-200"
                          }`}>
                            "{currentDailyReport.patternExplanation}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfica de Barras Comparativa de Motores */}
                <div className={`p-5 rounded-2xl border ${
                  darkMode ? "bg-slate-950/30 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <Sliders size={14} />
                    Comparación de Rendimiento por Motor Matemático hoy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {currentAnalysis.performances.map((perf, idx) => {
                      const colors = [
                        { bar: "from-blue-600 to-cyan-500", text: "text-blue-400" },
                        { bar: "from-amber-600 to-yellow-500", text: "text-amber-400" },
                        { bar: "from-emerald-600 to-teal-500", text: "text-emerald-400" },
                        { bar: "from-purple-600 to-pink-500", text: "text-purple-400" },
                      ][idx] || { bar: "from-indigo-600 to-indigo-500", text: "text-indigo-400" };

                      return (
                        <div key={perf.engine} className={`p-4 rounded-xl border ${
                          darkMode ? "bg-slate-900/40 border-slate-800/60" : "bg-slate-50 border-slate-100"
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-black uppercase text-slate-300">{perf.engine}</span>
                            <span className={`text-xs font-bold font-mono ${colors.text}`}>
                              {perf.hits}/{perf.total} aciertos
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1 mb-2">
                            <span className="text-xl font-black text-white">{perf.accuracy.toFixed(1)}%</span>
                            <span className="text-[10px] text-slate-500">precisión</span>
                          </div>
                          {/* Barra de progreso */}
                          <div className="w-full bg-slate-850 h-2.5 rounded-full overflow-hidden border border-slate-800">
                            <div 
                              className={`h-full bg-gradient-to-r ${colors.bar} rounded-full transition-all duration-500`} 
                              style={{ width: `${perf.accuracy}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tabla/Cronología Detallada Hora por Hora de Predicciones y Aciertos */}
                <div className={`p-5 rounded-2xl border overflow-hidden ${
                  darkMode ? "bg-slate-950/30 border-slate-800" : "bg-white border-slate-200"
                }`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <TrendingUp size={14} />
                    Auditoría Detallada por Hora (Resultados vs Predicciones)
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-850 text-[10px] font-black uppercase tracking-wider text-slate-500">
                          <th className="py-2.5 px-3">Hora</th>
                          <th className="py-2.5 px-3">Sorteado</th>
                          <th className="py-2.5 px-3 text-center">Markov</th>
                          <th className="py-2.5 px-3 text-center">Bayes</th>
                          <th className="py-2.5 px-3 text-center">Poisson</th>
                          <th className="py-2.5 px-3 text-center">Monte Carlo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/40 text-xs">
                        {currentAnalysis.hourlyDetails.map((detail) => (
                          <tr key={detail.hour} className={`hover:bg-slate-900/10 transition-colors`}>
                            <td className="py-3 px-3 font-mono font-bold text-slate-400">{detail.hour}</td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-2">
                                <span className="text-lg filter drop-shadow">{detail.actualEmoji}</span>
                                <span className="font-bold text-slate-250">{detail.actualName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono font-bold">
                                  {detail.actualCode}
                                </span>
                              </div>
                            </td>
                            {/* Markov */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {detail.hits.markov ? (
                                  <span className="text-emerald-450 font-black flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <CheckCircle2 size={10} /> SÍ
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1 bg-slate-950/30 border border-slate-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <XCircle size={10} /> NO
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Bayes */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {detail.hits.bayesian ? (
                                  <span className="text-emerald-450 font-black flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <CheckCircle2 size={10} /> SÍ
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1 bg-slate-950/30 border border-slate-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <XCircle size={10} /> NO
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Poisson */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {detail.hits.poisson ? (
                                  <span className="text-emerald-450 font-black flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <CheckCircle2 size={10} /> SÍ
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1 bg-slate-950/30 border border-slate-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <XCircle size={10} /> NO
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Monte Carlo */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex flex-col items-center gap-1">
                                {detail.hits.monteCarlo ? (
                                  <span className="text-emerald-450 font-black flex items-center gap-1 bg-emerald-950/40 border border-emerald-800/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <CheckCircle2 size={10} /> SÍ
                                  </span>
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1 bg-slate-950/30 border border-slate-900/30 px-1.5 py-0.5 rounded text-[10px]">
                                    <XCircle size={10} /> NO
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="history-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <History size={14} />
                Historial de Meta-Análisis Persistidos en LocalStorage
              </h3>
              {Object.keys(savedHistory).length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-[10px] font-bold text-rose-400 hover:text-rose-350 hover:underline flex items-center gap-1 cursor-pointer bg-rose-950/20 border border-rose-900/35 px-2.5 py-1 rounded-lg"
                >
                  ✖ Vaciar Historial
                </button>
              )}
            </div>

            {Object.keys(savedHistory).length === 0 ? (
              <div className={`p-10 text-center rounded-2xl border ${
                darkMode ? "bg-slate-950/40 border-slate-800 text-slate-400" : "bg-white border-slate-200 text-slate-500"
              }`}>
                <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                <h3 className="font-black text-sm uppercase text-slate-300 mb-1">Historial Vacío</h3>
                <p className="text-xs max-w-md mx-auto">
                  Los resultados de meta-análisis se guardarán automáticamente en este panel una vez cargues datos reales o simulados para un día y lotería específicos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.entries(savedHistory).reverse().map(([key, item]) => {
                    const historicalRecord = accumulatedResults.find(
                      (r) => r.fecha === item.fecha && r.loteria === item.loteria
                    );
                    const historicalCounts: Record<string, number> = {};
                    if (historicalRecord) {
                      HOURS_LIST.forEach((hour) => {
                        const code = historicalRecord.draws?.[hour];
                        if (code) {
                          historicalCounts[code] = (historicalCounts[code] || 0) + 1;
                        }
                      });
                    }
                    const historicalTopAnimals = Object.entries(historicalCounts)
                      .map(([code, count]) => {
                        const meta = ANIMALITOS[code] || { name: "Desconocido", emoji: "🎲" };
                        return { code, name: meta.name, emoji: meta.emoji, count };
                      })
                      .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code))
                      .slice(0, 3);

                    return (
                      <div 
                        key={key} 
                        className={`p-5 rounded-2xl border flex flex-col gap-3 ${
                          darkMode ? "bg-slate-950/40 border-slate-800 hover:border-slate-700" : "bg-white border-slate-200 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-mono text-sm font-black text-white">{item.fecha}</h4>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{item.loteria}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                            getPatternBadgeClass(item.gamePattern)
                          }`}>
                            {item.gamePattern}
                          </span>
                        </div>

                        {historicalTopAnimals.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 items-center bg-black/10 p-2 rounded-xl border border-slate-900/50">
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 mr-1">Top Sorteados:</span>
                            {historicalTopAnimals.map((anim) => (
                              <span 
                                key={anim.code}
                                className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                                  darkMode ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-700"
                                }`}
                                title={`${anim.name} salió ${anim.count} veces`}
                              >
                                <span>{anim.emoji}</span>
                                <span className="text-[9px] font-mono opacity-60">#{anim.code}</span>
                                <span className="text-[9px] font-black uppercase text-amber-500">x{anim.count}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-slate-400 leading-relaxed bg-slate-900/20 p-3 rounded-lg border border-slate-900">
                          {item.patternExplanation}
                        </p>

                        <div className="grid grid-cols-4 gap-2 text-center">
                          {item.performances.map((perf) => (
                            <div key={perf.engine} className="bg-black/10 p-2 rounded-lg border border-slate-900">
                              <div className="text-[10px] text-slate-500 font-bold uppercase">{perf.engine}</div>
                              <div className="text-sm font-black text-white">{perf.accuracy.toFixed(0)}%</div>
                              <div className="text-[9px] text-slate-500 font-bold font-mono">{perf.hits}/{perf.total} aciertos</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

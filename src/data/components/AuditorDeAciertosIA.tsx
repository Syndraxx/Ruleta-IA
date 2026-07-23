import React, { useMemo, useState } from "react";
import { ANIMALITOS } from "../../data/animalitos";
import { computeComprehensiveOracle } from "../../utils/predictionEngine";
import { AccumulatedResult } from "../../types";
import { HOURS_LIST } from "../../constants";
import {
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  Database,
  Calendar,
  Sliders,
  Sparkles,
  Activity,
  Cpu,
  BarChart2,
  BookmarkCheck,
  Zap,
  Target
} from "lucide-react";

interface AuditorDeAciertosIAProps {
  accumulatedResults: AccumulatedResult[];
  loteria: string;
  darkMode: boolean;
  animalsCount?: number;
}

export const AuditorDeAciertosIA: React.FC<AuditorDeAciertosIAProps> = React.memo(({
  accumulatedResults,
  loteria,
  darkMode,
  animalsCount = 3,
}) => {
  const [auditDepth, setAuditDepth] = useState<number>(8); // Límite por defecto de 8 días de auditoría para conservar CPU
  const [selectedLimit, setSelectedLimit] = useState<number>(animalsCount);

  // Reproducir sonido sutil para interactividad de la UI
  const playSound = (type: "click" | "success") => {
    try {
      const freq = type === "success" ? 600 : 350;
      const duration = type === "success" ? 0.15 : 0.08;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (type === "success") {
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + duration);
      }
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      // Ignorar errores de audio si el navegador bloquea la reproducción de audio autónoma
    }
  };

  const auditResults = useMemo(() => {
    const hits: any[] = [];
    const engineStats = {
      Markov: { hits: 0, total: 0 },
      Bayes: { hits: 0, total: 0 },
      Poisson: { hits: 0, total: 0 },
      MonteCarlo: { hits: 0, total: 0 },
    };

    let totalPredictions = 0;
    let totalHitsCombined = 0;

    // Sort chronologically
    const sorted = [...accumulatedResults]
      .filter((r) => r.loteria === loteria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const totalRecords = sorted.length;
    const startIndex = Math.max(0, totalRecords - auditDepth);
    const evaluationSubset = sorted.slice(startIndex);

    evaluationSubset.forEach((record) => {
      // Find index in original sorted list to correctly slice historyBefore
      const idxInOriginal = sorted.findIndex((r) => r.fecha === record.fecha);
      const historyBefore = idxInOriginal !== -1 ? sorted.slice(0, idxInOriginal) : [];
      
      HOURS_LIST.forEach((hour) => {
        const actualCode = record.draws[hour];
        if (!actualCode) return;

        // Current draws context (only hours before the current one in the same day)
        const currentDraws: Record<string, string | null> = {};
        HOURS_LIST.forEach((h) => {
          if (HOURS_LIST.indexOf(h) < HOURS_LIST.indexOf(hour)) {
            currentDraws[h] = record.draws[h];
          }
        });

        // Run Prediction with lightweight simulations count (500) for fast batch processing
        const oracle = computeComprehensiveOracle(historyBefore, currentDraws, loteria, hour, HOURS_LIST, false, record.fecha, 500);
        
        totalPredictions++;

        // 1. Markov Hits
        const markovCandidates = (oracle.markov?.order1 || []).slice(0, selectedLimit);
        const hasMarkovHit = markovCandidates.some((c) => c.code === actualCode);
        engineStats.Markov.total++;
        if (hasMarkovHit) engineStats.Markov.hits++;

        // 2. Bayesian Hits
        const bayesianCandidates = (oracle.bayesian?.hotList || []).slice(0, selectedLimit);
        const hasBayesHit = bayesianCandidates.some((c) => c.code === actualCode);
        engineStats.Bayes.total++;
        if (hasBayesHit) engineStats.Bayes.hits++;

        // 3. Poisson Hits
        const poissonCandidates = (oracle.poisson?.densityList || []).slice(0, selectedLimit);
        const hasPoissonHit = poissonCandidates.some((c) => c.code === actualCode);
        engineStats.Poisson.total++;
        if (hasPoissonHit) engineStats.Poisson.hits++;

        // 4. Monte Carlo Hits
        const mcCandidates = (oracle.monteCarlo?.probabilityCloud || []).slice(0, selectedLimit);
        const hasMCHit = mcCandidates.some((c) => c.code === actualCode);
        engineStats.MonteCarlo.total++;
        if (hasMCHit) engineStats.MonteCarlo.hits++;

        // If Monte Carlo (our main integrated predictor) hit, register it
        if (hasMCHit) {
          totalHitsCombined++;
        }

        hits.push({
          date: record.fecha,
          hour,
          actual: actualCode,
          actualName: ANIMALITOS[actualCode]?.name,
          actualEmoji: ANIMALITOS[actualCode]?.emoji,
          engines: {
            Markov: { hit: hasMarkovHit, top: markovCandidates.map(c => `${ANIMALITOS[c.code]?.emoji || ""} ${c.code}`) },
            Bayes: { hit: hasBayesHit, top: bayesianCandidates.map(c => `${ANIMALITOS[c.code]?.emoji || ""} ${c.code}`) },
            Poisson: { hit: hasPoissonHit, top: poissonCandidates.map(c => `${ANIMALITOS[c.code]?.emoji || ""} ${c.code}`) },
            MonteCarlo: { hit: hasMCHit, top: mcCandidates.map(c => `${ANIMALITOS[c.code]?.emoji || ""} ${c.code}`) },
          },
        });
      });
    });

    const engineCalculations = Object.entries(engineStats).map(([name, data]) => {
      const percentage = data.total > 0 ? (data.hits / data.total) * 100 : 0;
      return {
        name,
        hits: data.hits,
        total: data.total,
        percentage,
      };
    });

    const sortedEngines = [...engineCalculations].sort((a, b) => b.percentage - a.percentage);
    const champion = sortedEngines[0]?.percentage > 0 ? sortedEngines[0].name : "Ninguno";

    return {
      hits: hits.reverse(), // Newest first
      combinedPercentage: totalPredictions > 0 ? (totalHitsCombined / totalPredictions) * 100 : 0,
      totalPredictions,
      totalHitsCombined,
      analyzedDays: evaluationSubset.length,
      totalAvailableDays: totalRecords,
      engineStats: engineCalculations,
      champion,
    };
  }, [accumulatedResults, loteria, selectedLimit, auditDepth]);

  const getEngineColor = (name: string) => {
    switch (name) {
      case "Markov": return "bg-emerald-500 text-emerald-400 border-emerald-500/20";
      case "Bayes": return "bg-indigo-500 text-indigo-400 border-indigo-500/20";
      case "Poisson": return "bg-pink-500 text-pink-400 border-pink-500/20";
      case "MonteCarlo": return "bg-yellow-500 text-yellow-400 border-yellow-500/20";
      default: return "bg-slate-500 text-slate-400 border-slate-500/20";
    }
  };

  const getEngineFriendlyName = (name: string) => {
    switch (name) {
      case "Markov": return "Cadenas de Markov";
      case "Bayes": return "Inferencia Bayesiana";
      case "Poisson": return "Distribución de Poisson";
      case "MonteCarlo": return "Simulación de Monte Carlo";
      default: return name;
    }
  };

  return (
    <div className={`p-6 rounded-3xl border-2 transition-all duration-300 relative overflow-hidden backdrop-blur-md ${
      darkMode 
        ? "border-slate-800 bg-slate-900/40 shadow-2xl" 
        : "border-slate-200 bg-white/80 shadow-xl"
    }`}>
      {/* Luces sutiles de fondo en modo oscuro */}
      {darkMode && (
        <>
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />
        </>
      )}

      {/* Cabecera Interactiva del Auditor */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5 mb-6 pb-5 border-b border-slate-800/80">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-[9px] bg-indigo-950/40 text-indigo-400 border border-indigo-800/30 px-2.5 py-1 rounded font-black font-mono uppercase tracking-wider">
            <Target size={10} className="animate-pulse text-indigo-400" />
            Módulo Científico de Backtesting
          </span>
          <h2 className={`text-xl font-black uppercase tracking-wider flex items-center gap-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
            <span>🔎</span> AUDITOR DE ACIESTOS IA EN TIEMPO REAL
          </h2>
          <p className={`text-xs font-sans ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Audita el rendimiento predictivo contrastando de forma retrospectiva los pronósticos de nuestros 4 motores contra los resultados oficiales registrados en {loteria}.
          </p>
        </div>

        {/* Controladores Interactivos */}
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          {/* Controlador de Profundidad */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Calendar size={10} /> Profundidad (Días)
            </label>
            <select
              value={auditDepth}
              onChange={(e) => {
                setAuditDepth(Number(e.target.value));
                playSound("click");
              }}
              className={`text-xs font-black rounded-xl px-3 py-2 border outline-none cursor-pointer transition-all ${
                darkMode 
                  ? "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <option value={5}>Últimos 5 días</option>
              <option value={8}>Últimos 8 días (Recomendado)</option>
              <option value={15}>Últimos 15 días</option>
              <option value={30}>Últimos 30 días</option>
            </select>
          </div>

          {/* Controlador de Margen (Top N) */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sliders size={10} /> Tolerancia (Top N)
            </label>
            <select
              value={selectedLimit}
              onChange={(e) => {
                setSelectedLimit(Number(e.target.value));
                playSound("click");
              }}
              className={`text-xs font-black rounded-xl px-3 py-2 border outline-none cursor-pointer transition-all ${
                darkMode 
                  ? "bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700" 
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <option value={1}>Solo Top 1 (Precisión Pura)</option>
              <option value={2}>Top 2 Animales</option>
              <option value={3}>Top 3 Animales (Predeterminado)</option>
              <option value={5}>Top 5 Animales (Mayor Respaldo)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Panel Superior Bento: KPIs & Tabla Dedicada de Motores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        
        {/* LADO IZQUIERDO: KPIs Globales */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Tarjeta KPI 1: Efectividad Combinada */}
          <div className={`p-5 rounded-2xl border-2 flex flex-col justify-between relative overflow-hidden ${
            darkMode ? "bg-indigo-950/20 border-indigo-900/30 text-white" : "bg-indigo-50 border-indigo-100 text-slate-950"
          }`}>
            <div className="absolute top-0 right-0 p-3 opacity-20">
              <Sparkles size={32} className="text-indigo-400" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Efectividad Global (Monte Carlo)</div>
              <div className="text-4xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-pink-400 to-yellow-400 mt-1">
                {auditResults.combinedPercentage.toFixed(2)}%
              </div>
            </div>
            <div className="text-xs text-slate-500 mt-4 pt-3 border-t border-indigo-500/10 flex justify-between items-center">
              <span>Sorteos analizados:</span>
              <span className="font-mono font-bold text-indigo-400">{auditResults.totalHitsCombined} / {auditResults.totalPredictions}</span>
            </div>
          </div>

          {/* Tarjeta KPI 2: Motor Líder de Precisión */}
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between relative overflow-hidden ${
            darkMode ? "bg-emerald-950/20 border-emerald-900/30 text-white" : "bg-emerald-50 border-emerald-100 text-slate-950"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">🏆</span>
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Líder Histórico actual</div>
                <div className="text-sm font-black text-white uppercase mt-0.5">
                  {getEngineFriendlyName(auditResults.champion)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* LADO DERECHO: Tabla de Efectividad de los Motores IA (TABLA DEDICADA) */}
        <div className={`lg:col-span-8 p-5 rounded-2xl border-2 flex flex-col justify-between ${
          darkMode ? "bg-slate-950/60 border-slate-850" : "bg-slate-50 border-slate-200"
        }`}>
          <div className="mb-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
              <BarChart2 size={12} /> COMPARATIVA DE EFECTIVIDAD POR MOTOR IA
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Porcentaje de acierto individual para cada motor matemático analizando el Top {selectedLimit} de candidatos recomendados.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase font-black tracking-widest text-slate-500">
                  <th className="pb-2.5 font-mono">Motor Predictivo</th>
                  <th className="pb-2.5 font-mono text-center">Aciertos / Total</th>
                  <th className="pb-2.5 font-mono text-right">Efectividad %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/50">
                {auditResults.engineStats.map((engine, idx) => (
                  <tr key={engine.name} className="hover:bg-slate-900/20 transition-colors">
                    {/* Nombre del Motor */}
                    <td className="py-2.5 flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${getEngineColor(engine.name).split(" ")[0]}`} />
                      <span className="text-xs font-black text-slate-200 font-sans">
                        {getEngineFriendlyName(engine.name)}
                      </span>
                    </td>
                    {/* Conteo de Aciertos */}
                    <td className="py-2.5 text-center text-xs font-mono font-bold text-slate-400">
                      {engine.hits} <span className="text-slate-600">/</span> {engine.total}
                    </td>
                    {/* Barra de progreso y Porcentaje de Efectividad */}
                    <td className="py-2.5 text-right">
                      <div className="inline-flex items-center gap-3">
                        <div className="hidden sm:block w-24 h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${getEngineColor(engine.name).split(" ")[0]}`}
                            style={{ width: `${engine.percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono font-black text-white">
                          {engine.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Historial Detallado Sorteo por Sorteo */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <BookmarkCheck size={12} className="text-indigo-400" /> HISTORIAL DE AUDITORÍA DETALLADO
          </h3>
          <span className="text-[10px] font-mono font-bold text-slate-500">
            Mostrando {auditResults.hits.length} Sorteos
          </span>
        </div>

        {auditResults.hits.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40 max-h-[380px] scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full text-left border-collapse table-fixed min-w-[750px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-850 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <th className="p-3 w-32">Sorteo / Fecha</th>
                  <th className="p-3 w-32">Ganador Real</th>
                  <th className="p-3 text-center">Markov</th>
                  <th className="p-3 text-center">Bayes</th>
                  <th className="p-3 text-center">Poisson</th>
                  <th className="p-3 text-center">Monte Carlo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {auditResults.hits.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                    {/* Fecha y Hora */}
                    <td className="p-3 border-r border-slate-900/30">
                      <div className="font-mono text-xs font-black text-white">{item.hour}</div>
                      <div className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">{item.date}</div>
                    </td>

                    {/* Resultado Real Scrapeado */}
                    <td className="p-3 border-r border-slate-900/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none select-none">{item.actualEmoji}</span>
                        <div>
                          <span className="font-mono text-xs font-black text-yellow-500">{item.actual}</span>
                          <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[80px]">{item.actualName}</div>
                        </div>
                      </div>
                    </td>

                    {/* Resultados de los 4 Motores */}
                    {Object.entries(item.engines).map(([name, engData]: [string, any]) => (
                      <td key={name} className="p-3 text-center border-r border-slate-900/20 last:border-r-0">
                        <div className="flex flex-col items-center justify-center gap-1">
                          <span className="text-[8px] text-slate-500 font-mono font-bold tracking-tight uppercase truncate max-w-full">
                            {engData.top.join(", ")}
                          </span>
                          {engData.hit ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-950/40 border border-emerald-800/30 text-emerald-400 text-[8px] font-black rounded uppercase tracking-wider font-mono">
                              <CheckCircle2 size={7} /> HIT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-900/40 border border-slate-800/30 text-slate-500 text-[8px] font-black rounded uppercase tracking-wider font-mono opacity-60">
                              <XCircle size={7} /> MISS
                            </span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={`py-12 text-center text-xs font-bold font-sans rounded-xl border ${
            darkMode ? "bg-slate-950/30 border-slate-850 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            Ningún sorteo histórico coincide con la lotería seleccionada ({loteria}). Registra o scrapea sorteos para habilitar la auditoría.
          </div>
        )}
      </div>

    </div>
  );
});

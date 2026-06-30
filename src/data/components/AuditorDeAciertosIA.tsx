import React, { useMemo } from "react";
import { ANIMALITOS } from "../../data/animalitos";
import { computeComprehensiveOracle } from "../../utils/predictionEngine";
import { AccumulatedResult } from "../../types";
import { HOURS_LIST } from "../../constants";

interface AuditorDeAciertosIAProps {
  accumulatedResults: AccumulatedResult[];
  loteria: string;
  darkMode: boolean;
  animalsCount?: number;
}

export const AuditorDeAciertosIA: React.FC<AuditorDeAciertosIAProps> = ({
  accumulatedResults,
  loteria,
  darkMode,
  animalsCount = 2,
}) => {
  const auditResults = useMemo(() => {
    const hits: any[] = [];
    let totalPredictions = 0;
    let totalHits = 0;

    // Sort chronologically
    const sorted = [...accumulatedResults]
      .filter((r) => r.loteria === loteria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Iterate through records to simulate predictions at each point in time
    sorted.forEach((record, idx) => {
      const historyBefore = sorted.slice(0, idx);
      
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

        // Run Prediction
        const oracle = computeComprehensiveOracle(historyBefore, currentDraws, loteria, hour, HOURS_LIST, false, record.fecha);
        
        totalPredictions++;
        
        // Check for hits (in top predictions)
        const limit = animalsCount;
        const topN = oracle.monteCarlo.probabilityCloud.slice(0, limit);
        const hit = topN.find((c) => c.code === actualCode);
        const hitIdx = hit ? topN.indexOf(hit) : -1;

        if (hitIdx !== -1) {
          totalHits++;
          hits.push({
            date: record.fecha,
            hour,
            actual: actualCode,
            actualName: ANIMALITOS[actualCode]?.name,
            actualEmoji: ANIMALITOS[actualCode]?.emoji,
            rank: hitIdx + 1,
            type: hitIdx === 0 ? "IA-Acierto" : "Respaldo",
            confidence: hit?.percentage,
          });
        }
      });
    });

    return {
      hits: hits.reverse(), // Newest first
      percentage: totalPredictions > 0 ? (totalHits / totalPredictions) * 100 : 0,
      totalPredictions,
      totalHits
    };
  }, [accumulatedResults, loteria, animalsCount]);

  return (
    <div className={`p-6 rounded-3xl border ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
        <h2 className={`text-2xl font-black mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>Auditor de Aciertos IA</h2>
        <div className={`mb-6 p-4 rounded-xl ${darkMode ? "bg-indigo-950/30" : "bg-indigo-50"}`}>
            <div className="text-sm font-bold text-indigo-400">Efectividad Acumulada</div>
            <div className="text-4xl font-black text-indigo-200">{auditResults.percentage.toFixed(2)}%</div>
            <div className="text-xs text-slate-500">Aciertos: {auditResults.totalHits} / {auditResults.totalPredictions}</div>
        </div>

        <div className="space-y-4">
            {auditResults.hits.length > 0 ? (
                auditResults.hits.map((item, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex items-center justify-between ${darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}>
                        <div className="flex items-center gap-4">
                            <span className="text-4xl">{item.actualEmoji}</span>
                            <div>
                                <div className="font-bold">{item.actualName} ({item.actual})</div>
                                <div className="text-xs text-slate-500">{item.date} - {item.hour}</div>
                            </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-black ${item.rank === 1 ? "bg-purple-900/50 text-purple-200" : "bg-slate-700 text-slate-300"}`}>
                            {item.type} ({item.confidence?.toFixed(1)}%)
                        </div>
                    </div>
                ))
            ) : (
                <div className={`p-6 text-center rounded-xl border ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-500"}`}>
                    No hay registros de aciertos todavía.
                </div>
            )}
        </div>
    </div>
  );
};

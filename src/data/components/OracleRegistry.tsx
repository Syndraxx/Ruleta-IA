import React, { useMemo } from "react";
import { ANIMALITOS } from "../../data/animalitos";
import { computeComprehensiveOracle } from "../../utils/predictionEngine";
import { AccumulatedResult, DrawsRecord } from "../../types";

interface OracleRegistryProps {
  accumulatedResults: AccumulatedResult[];
  hoursList: string[];
  loteria: string;
  darkMode: boolean;
}

export const OracleRegistry: React.FC<OracleRegistryProps> = ({
  accumulatedResults,
  hoursList,
  loteria,
  darkMode,
}) => {
  const registry = useMemo(() => {
    const data: any[] = [];

    // Sort and iterate to simulate real-time
    const sorted = [...accumulatedResults]
      .filter((r) => r.loteria === loteria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    // Precompute hour -> index map to avoid indexOf in loops
    const hourIndex: Record<string, number> = {};
    for (let i = 0; i < hoursList.length; i++) hourIndex[hoursList[i]] = i;

    // Maintain incremental historyBefore to avoid slice() allocations per iteration
    const historyBefore: AccumulatedResult[] = [];

    for (let recIdx = 0; recIdx < sorted.length; recIdx++) {
      const record = sorted[recIdx];

      // Build currentDraws incrementally: start empty and add hours as we progress
      const currentDraws: Record<string, string | null> = {};

      for (let hIdx = 0; hIdx < hoursList.length; hIdx++) {
        const hour = hoursList[hIdx];
        const actualCode = record.draws?.[hour];
        // Before checking this hour, currentDraws contains draws of prior hours (0..hIdx-1)

        if (actualCode) {
          // Call oracle with historyBefore and currentDraws up to this hour
          const oracle = computeComprehensiveOracle(historyBefore, currentDraws, loteria, hour, hoursList, false, record.fecha);

          const top3 = oracle.monteCarlo.probabilityCloud.slice(0, 3);
          const hit = top3.find((c) => c.code === actualCode);
          const hitIdx = hit ? top3.indexOf(hit) : -1;

          if (hitIdx !== -1) {
            data.push({
              date: record.fecha,
              hour,
              actual: actualCode,
              actualName: ANIMALITOS[actualCode],
              actualEmoji: ANIMALITOS[actualCode],
              rank: hitIdx + 1,
              type: hitIdx === 0 ? "Super Acierto IA" : "Acierto de Respaldo",
              confidence: hit?.percentage,
            });
          }
        }

        // After processing hour, add it to currentDraws for next hours
        const codeForHour = record.draws?.[hour] || null;
        if (codeForHour) currentDraws[hour] = codeForHour;
      }

      // push the current record into historyBefore for the next record
      historyBefore.push(record);
    }

    return data.reverse(); // Newest first
  }, [accumulatedResults, hoursList, loteria]);

  return (
    <div className={`p-6 rounded-3xl border ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}>
      <h2 className={`text-2xl font-black mb-6 ${darkMode ? "text-white" : "text-slate-900"}`}>Registro de Aciertos del Oráculo</h2>
      <div className="space-y-4">
        {registry.map((item, i) => (
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
        ))}
      </div>
    </div>
  );
};

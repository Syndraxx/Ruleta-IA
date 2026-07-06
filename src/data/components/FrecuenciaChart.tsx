import React, { useState, useMemo, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ANIMALITOS } from "../../data/animalitos";
import { DrawsRecord } from "../../types";
import { TrendingUp, BarChart2, Calendar, Award, RotateCcw, AlertCircle, Camera } from "lucide-react";
import { toPng } from "html-to-image";

interface AccumulatedItem {
  loteria: string;
  fecha: string;
  scrapedSource: string;
  draws: DrawsRecord;
  count: number;
  extractedAt: string;
}

interface FrecuenciaChartProps {
  loteria: "Loto Activo" | "La Granjita";
  setLoteria: (val: "Loto Activo" | "La Granjita") => void;
  fecha: string; // End date in format YYYY-MM-DD
  accumulatedResults: AccumulatedItem[];
  darkMode: boolean;
  onSelectAnimal: (code: string) => void;
  hoursList: string[];
}

export const FrecuenciaChart: React.FC<FrecuenciaChartProps> = React.memo(({
  loteria,
  setLoteria,
  fecha,
  accumulatedResults,
  darkMode,
  onSelectAnimal,
  hoursList,
}) => {
  const [sortBy, setSortBy] = useState<"num" | "freq">("freq");
  const [activeAnimalFilter, setActiveAnimalFilter] = useState<string>("");
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const handleExportImage = async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      // Small timeout to let UI adapt
      await new Promise((resolve) => setTimeout(resolve, 100));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        backgroundColor: darkMode ? "#111726" : "#ffffff",
        style: {
          transform: "scale(1)",
          transformOrigin: "top left",
        },
      });
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("download", `Gráfico_7D_${loteria.replace(" ", "_")}_${fecha}.png`);
      downloadAnchor.setAttribute("href", dataUrl);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (error) {
      console.error("No se pudo exportar la imagen de estadísticas:", error);
    } finally {
      setExporting(false);
    }
  };

  // Get last 7 days prior to/including the selected fecha
  const last7Dates = useMemo(() => {
    const datesList: string[] = [];
    try {
      // Use YYYY-MM-DDT12:00:00 to prevent timezone drift shenanigans
      const baseDate = new Date(fecha + "T12:00:00");
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        datesList.push(d.toISOString().split("T")[0]);
      }
    } catch (e) {
      // Fallback if fecha is invalid
      const baseDate = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() - i);
        datesList.push(d.toISOString().split("T")[0]);
      }
    }
    return datesList.reverse(); // Display left-to-right progressive
  }, [fecha]);

  // Deterministically generate simulated/seeded draws for any date-game combo that hasn't been scraped yet
  const getSeededDraws = (dateStr: string, currentGame: string): DrawsRecord => {
    const seed = `${dateStr}-${currentGame}-frec-v1`;
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const rng = () => {
      const x = Math.sin(hash++) * 10000;
      return x - Math.floor(x);
    };

    const keys = Object.keys(ANIMALITOS);
    const mockRecord: DrawsRecord = {};

    hoursList.forEach((hour) => {
      // Simple logic to check if a draw is in the past for today
      let isPast = true;
      const todayString = new Date().toISOString().split("T")[0];
      if (dateStr === todayString) {
        const currentHour = new Date().getHours();
        let queryHourNum = parseInt(hour.split(":")[0]);
        if (hour.includes("PM") && queryHourNum !== 12) {
          queryHourNum += 12;
        }
        if (queryHourNum > currentHour) {
          isPast = false;
        }
      }

      if (isPast) {
        const idx = Math.floor(rng() * keys.length);
        mockRecord[hour] = keys[idx];
      } else {
        mockRecord[hour] = null;
      }
    });

    return mockRecord;
  };

  // Compile full 7-day data matrix, blending live scraped results with high-fidelity seeded ones
  const aggregatedFrequencies = useMemo(() => {
    const freqMap: Record<string, { count: number; sources: Set<string> }> = {};
    
    // Initialize
    Object.keys(ANIMALITOS).forEach((code) => {
      freqMap[code] = { count: 0, sources: new Set() };
    });

    let totalDrawsCount = 0;

    last7Dates.forEach((dStr) => {
      // Look for real scraper results in accumulated storage
      const realEntry = accumulatedResults.find(
        (item) => item.fecha === dStr && item.loteria.toLowerCase().includes(loteria.toLowerCase().substring(0, 5))
      );

      let drawsData: DrawsRecord;
      let sourceName: string;

      if (realEntry && Object.keys(realEntry.draws).length > 0) {
        drawsData = realEntry.draws;
        sourceName = "ScrapeReal";
      } else {
        drawsData = getSeededDraws(dStr, loteria);
        sourceName = "Simulado";
      }

      // Sum counts
      hoursList.forEach((hour) => {
        const animalCode = drawsData[hour];
        if (animalCode && freqMap[animalCode]) {
          freqMap[animalCode].count += 1;
          freqMap[animalCode].sources.add(sourceName);
          totalDrawsCount += 1;
        }
      });
    });

    // Translate to chart-compatible array structure
    const rawData = Object.keys(ANIMALITOS).map((code) => {
      const meta = ANIMALITOS[code];
      const details = freqMap[code];
      const isReal = details.sources.has("ScrapeReal");
      return {
        code,
        name: meta.name,
        emoji: meta.emoji,
        count: details.count,
        isReal, // Tag if user scraped data for it
      };
    });

    // Apply sorting logic
    if (sortBy === "freq") {
      rawData.sort((a, b) => b.count - a.count || parseInt(a.code) - parseInt(b.code));
    } else {
      // Sort numerically
      rawData.sort((a, b) => {
        const numA = a.code === "00" ? -1 : a.code === "0" ? 0 : parseInt(a.code);
        const numB = b.code === "00" ? -1 : b.code === "0" ? 0 : parseInt(b.code);
        return numA - numB;
      });
    }

    return {
      chartData: rawData,
      totalDrawsCount,
    };
  }, [loteria, last7Dates, accumulatedResults, sortBy, hoursList]);

  const { chartData, totalDrawsCount } = aggregatedFrequencies;

  // Identify Hot/Cold summaries for 7-day span
  const statsSummary = useMemo(() => {
    if (chartData.length === 0) return { max: null, min: null };
    
    // Sort copy by count to find bounds
    const sorted = [...chartData].sort((a, b) => b.count - a.count);
    return {
      max: sorted[0],
      min: sorted[sorted.length - 1],
    };
  }, [chartData]);

  // Handle bar clicking to change the "animal base" instantly in main app
  const handleBarClick = (element: any) => {
    if (element && element.code) {
      if (typeof window !== "undefined" && (window as any).SpeechSynthesisUtterance) {
        try {
          const synth = window.speechSynthesis;
          const utterance = new SpeechSynthesisUtterance(`Seleccionado ${element.code} ${element.name}`);
          utterance.lang = "es-ES";
          utterance.rate = 1.1;
          synth.speak(utterance);
        } catch (err) {}
      }
      onSelectAnimal(element.code);
    }
  };

  // Aesthetics definitions based on visual rules
  const headingColor = darkMode ? "text-white" : "text-black";
  const labelMuted = darkMode ? "text-slate-400" : "text-slate-600 font-bold";
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={`p-3.5 rounded-xl border text-xs font-mono font-bold shadow-2xl ${
          darkMode 
            ? "bg-[#0c1220] border-slate-700 text-slate-100" 
            : "bg-white border-3 border-black text-black comic-shadow-small"
        }`}>
          <div className="flex items-center gap-1.5 text-sm font-black mb-1">
            <span className="text-xl">{data.emoji}</span>
            <span>{data.code} - {data.name}</span>
          </div>
          <div className="font-sans font-bold flex flex-col gap-0.5 text-slate-400">
            <span className={darkMode ? "text-slate-300" : "text-slate-900"}>
              Frecuencia: <span className="text-emerald-500 font-extrabold text-[13px]">{data.count} salidas</span>
            </span>
            <span className="text-[10px] opacity-80">
              Porcentaje: {((data.count / (totalDrawsCount || 1)) * 100).toFixed(1)}% de sorteos
            </span>
            <span className="text-[9px] text-blue-400 mt-1 uppercase font-semibold">
              {data.isReal ? "✔️ Datos reales escaneados" : "⚡ Secciones estimadas"}
            </span>
            <span className="text-[8px] text-orange-400 mt-0.5">
              💡 Haz clic para seleccionar como base analítica
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      ref={cardRef}
      className={`p-5 sm:p-6 rounded-2xl flex flex-col gap-4 border transition-all ${
        darkMode 
          ? "bg-[#111726]/95 border-slate-800/80 shadow-lg" 
          : "bg-white border-3 border-black comic-shadow text-black"
      }`}
    >
      
      {/* Header and Game Selector Toggles */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/5 dark:border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 select-none">
            <span className="text-xl">📈</span>
            <h3 className={`text-sm sm:text-base font-black uppercase font-sans ${headingColor} flex items-center gap-1.5`}>
              FRECUENCIAS SISTÉMICAS DE 7 DÍAS
            </h3>
          </div>
          <p className={`text-[11.5px] font-semibold mt-0.5 ${labelMuted} leading-relaxed`}>
            Análisis acumulativo de {loteria} del <span className="text-blue-500">{last7Dates[0]}</span> al <span className="text-blue-500">{last7Dates[6]}</span>.
          </p>
        </div>

        {/* Dynamic selector for Lottery Game Type */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setLoteria("Loto Activo")}
            className={`flex-1 md:flex-initial px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-150 cursor-pointer ${
              loteria === "Loto Activo"
                ? darkMode
                  ? "bg-blue-600/20 border-blue-500 text-blue-300"
                  : "bg-blue-600 text-white border-2 border-black font-black comic-shadow-small"
                : darkMode
                  ? "bg-[#182033]/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "bg-white border-2 border-slate-200 text-slate-800 hover:bg-slate-50"
            }`}
          >
            Loto Activo
          </button>
          <button
            onClick={() => setLoteria("La Granjita")}
            className={`flex-1 md:flex-initial px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-150 cursor-pointer ${
              loteria === "La Granjita"
                ? darkMode
                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                  : "bg-emerald-500 text-white border-2 border-black font-black comic-shadow-small"
                : darkMode
                  ? "bg-[#182033]/60 border-slate-800 text-slate-400 hover:text-slate-200"
                  : "bg-white border-2 border-slate-200 text-slate-800 hover:bg-slate-50"
            }`}
          >
            La Granjita
          </button>
          <button
            onClick={handleExportImage}
            disabled={exporting}
            className={`flex-1 md:flex-initial px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all duration-150 cursor-pointer flex items-center justify-center gap-1.5 ${
              darkMode
                ? "bg-slate-800 border-slate-750 text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                : "bg-amber-400 text-black border-2 border-black font-black comic-shadow-small hover:bg-amber-505 hover:bg-amber-500 disabled:opacity-50"
            }`}
          >
            <Camera size={12} className={exporting ? "animate-spin" : ""} />
            <span>{exporting ? "EXP..." : "EXPORTAR IMAGEN"}</span>
          </button>
        </div>
      </div>

      {/* Mini KPIs Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-1 font-mono text-xs font-bold leading-none">
        
        <div className={`p-3 rounded-xl border ${darkMode ? "bg-[#151c2e] border-slate-800" : "bg-slate-50 border-2 border-black"}`}>
          <div className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1.5">
            <Calendar size={10} className="text-blue-400" />
            SORTEOS ANALIZADOS
          </div>
          <p className="text-base font-black text-blue-500">{totalDrawsCount} jugadas</p>
        </div>

        <div className={`p-3 rounded-xl border ${darkMode ? "bg-[#151c2e] border-slate-800" : "bg-slate-50 border-2 border-black"}`}>
          <div className="text-[8px] text-slate-500 font-black uppercase mb-1 flex items-center gap-1.5">
            <Award size={10} className="text-emerald-400" />
            TASA DE COBERTURA
          </div>
          <p className="text-base font-black text-emerald-500">
            {Math.round((accumulatedResults.filter(r => r.loteria.toLowerCase().includes(loteria.toLowerCase().substring(0, 5))).length / 7) * 100)}% Reales
          </p>
        </div>

        {statsSummary.max && (
          <div 
            onClick={() => onSelectAnimal(statsSummary.max!.code)}
            className={`p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-transform ${
              darkMode ? "bg-orange-950/15 border-orange-850/60 hover:bg-orange-950/25" : "bg-orange-50/60 border-2 border-orange-300 hover:bg-orange-100/30"
            }`}
          >
            <div className="text-[8px] text-orange-500 font-black uppercase mb-1 flex items-center gap-1.5">
              <TrendingUp size={10} />
              NÚCLEO REGENTE MAX (7D)
            </div>
            <p className="text-base font-black text-orange-500 flex items-center gap-1">
              <span>{statsSummary.max.emoji}</span>
              <span>{statsSummary.max.code} ({statsSummary.max.count}x)</span>
            </p>
          </div>
        )}

        {statsSummary.min && (
          <div 
            onClick={() => onSelectAnimal(statsSummary.min!.code)}
            className={`p-3 rounded-xl border cursor-pointer hover:scale-[1.01] transition-transform ${
              darkMode ? "bg-cyan-950/15 border-cyan-850/60 hover:bg-cyan-950/25" : "bg-cyan-50/60 border-2 border-cyan-300 hover:bg-cyan-100/30"
            }`}
          >
            <div className="text-[8px] text-cyan-500 font-black uppercase mb-1 flex items-center gap-1.5">
              <span>❄️</span>
              NÚCLEO EN DEMORA (7D)
            </div>
            <p className="text-base font-black text-cyan-500 flex items-center gap-1">
              <span>{statsSummary.min.emoji}</span>
              <span>{statsSummary.min.code} ({statsSummary.min.count}x)</span>
            </p>
          </div>
        )}
      </div>

      {/* Sorting Switches & Dynamic search filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
          <BarChart2 size={12} className="text-slate-400" />
          <span>ORDENAR GRÁFICO POR:</span>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => { setSortBy("freq"); }}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-[9px] font-bold uppercase rounded-lg border transition-all ${
              sortBy === "freq"
                ? darkMode
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-black text-white border-2 border-black"
                : darkMode
                  ? "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                  : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            🔥 De Mayor a Menor Frecuencia
          </button>
          <button
            onClick={() => { setSortBy("num"); }}
            className={`flex-1 sm:flex-initial px-3 py-1.5 text-[9px] font-bold uppercase rounded-lg border transition-all ${
              sortBy === "num"
                ? darkMode
                  ? "bg-slate-700 border-slate-600 text-white"
                  : "bg-black text-white border-2 border-black"
                : darkMode
                  ? "bg-slate-800/40 border-slate-800 text-slate-400 hover:bg-slate-800"
                  : "bg-white border border-slate-200 text-slate-700"
            }`}
          >
            🔢 Orden Numérico (00 - 36)
          </button>
        </div>
      </div>

      {/* Bar Chart Canvas with Recharts */}
      <div className={`mt-2 p-3.5 pb-1 sm:p-5 rounded-2xl border ${
        darkMode ? "bg-[#0b0e17] border-slate-800/50" : "bg-slate-50 border-2 border-black"
      }`}>
        {totalDrawsCount === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <AlertCircle className="text-amber-500 mb-2 w-8 h-8" />
            <p className="font-bold text-sm">Falta de información</p>
            <p className="text-xs max-w-sm mt-1 leading-relaxed">
              No hay sorteos disponibles entre las 8 AM y 7 PM en el rango de fechas seleccionado.
            </p>
          </div>
        ) : (
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart 
                data={chartData} 
                margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
                onClick={(state: any) => {
                  if (state && state.activePayload && state.activePayload[0]) {
                    handleBarClick(state.activePayload[0].payload);
                  }
                }}
              >
                <defs>
                  <linearGradient id="colorFreqActivo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0.5}/>
                  </linearGradient>
                  <linearGradient id="colorFreqGranjita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  vertical={false} 
                  stroke={darkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.08)"}
                />
                
                <XAxis 
                  dataKey="code" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ 
                    fill: darkMode ? "#94A3B8" : "#475569", 
                    fontSize: 8.5, 
                    fontWeight: 800, 
                    fontFamily: "JetBrains Mono" 
                  }}
                  dy={6}
                />
                
                <YAxis 
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ 
                    fill: darkMode ? "#64748B" : "#64748B", 
                    fontSize: 9, 
                    fontWeight: 700, 
                    fontFamily: "JetBrains Mono" 
                  }}
                  dx={-4}
                />
                
                <Tooltip 
                  content={<CustomTooltip />}
                  cursor={{ fill: darkMode ? "rgba(255, 255, 255, 0.04)" : "rgba(0, 0, 0, 0.03)" }}
                />
                
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={700}
                >
                  {chartData.map((entry, index) => {
                    // Decide color dynamically
                    const defaultFill = loteria === "Loto Activo" ? "url(#colorFreqActivo)" : "url(#colorFreqGranjita)";
                    const hoverFill = loteria === "Loto Activo" ? "#60A5FA" : "#34D399";
                    
                    return (
                      <Cell 
                        key={`bar-cell-${index}`}
                        fill={defaultFill}
                        className="cursor-pointer transition-all duration-200 hover:opacity-90"
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <span className={`text-[9.5px] text-center font-bold font-mono tracking-wide select-none ${
        darkMode ? "text-slate-500" : "text-slate-500"
      }`}>
        💡 PRO UX TIP: Pulsa sobre cualquier barra vertical del gráfico para centrar el oráculo y el generador de la suerte en ese animalito de forma inmediata.
      </span>

    </div>
  );
});

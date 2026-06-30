import React from "react";
import { ANIMALITOS } from "../../data/animalitos";
import { ComprehensiveOracleResult } from "../../utils/predictionEngine";
import { Sparkles, Award, Star, Activity, Percent } from "lucide-react";

interface OraclePredictorProps {
  oracleData: ComprehensiveOracleResult | null;
  selectedHour: string;
  darkMode: boolean;
  onDeleteRecord?: () => void;
  isFuture?: boolean;
  animalsCount?: number;
}

export const OraclePredictor: React.FC<OraclePredictorProps> = ({
  oracleData,
  selectedHour,
  darkMode,
  onDeleteRecord,
  isFuture = false,
  animalsCount = 2,
}) => {
  if (!oracleData) return null;

  const { monteCarlo } = oracleData;
  const headingColor = darkMode ? "text-purple-300" : "text-purple-900";
  const textColor = darkMode ? "text-slate-350" : "text-slate-600";
  const cardBg = darkMode ? "bg-slate-950/40 backdrop-blur-md" : "bg-white/80 backdrop-blur-md";

  // Translucent acrylic themes for the plaques (Placas de Acrílico)
  const PLAQUE_THEMES = [
    {
      bg: darkMode 
        ? "bg-gradient-to-r from-teal-950/60 via-teal-900/30 to-slate-950/60" 
        : "bg-gradient-to-r from-teal-50/90 via-teal-100/40 to-white/95",
      border: darkMode ? "border-teal-500/40" : "border-teal-400/60",
      glow: "shadow-[0_0_15px_rgba(20,184,166,0.12)]",
      avatarBg: "bg-teal-500/10 border-teal-500/25",
      darkTextGlow: darkMode ? "text-teal-400" : "text-teal-700 font-extrabold",
      badgeBg: "bg-teal-500/15 text-teal-400 border-teal-500/30",
      label: "ORÁCULO ÓPTIMO",
      accentLine: "bg-teal-500"
    },
    {
      bg: darkMode 
        ? "bg-gradient-to-r from-amber-950/60 via-amber-900/30 to-slate-950/60" 
        : "bg-gradient-to-r from-amber-50/90 via-amber-100/40 to-white/95",
      border: darkMode ? "border-amber-500/40" : "border-amber-400/60",
      glow: "shadow-[0_0_15px_rgba(245,158,11,0.12)]",
      avatarBg: "bg-amber-500/10 border-amber-500/25",
      darkTextGlow: darkMode ? "text-amber-400" : "text-amber-700 font-extrabold",
      badgeBg: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      label: "RECOMENDADO",
      accentLine: "bg-amber-500"
    },
    {
      bg: darkMode 
        ? "bg-gradient-to-r from-blue-950/60 via-blue-900/30 to-slate-950/60" 
        : "bg-gradient-to-r from-blue-50/90 via-blue-100/40 to-white/95",
      border: darkMode ? "border-blue-500/40" : "border-blue-400/60",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.12)]",
      avatarBg: "bg-blue-500/10 border-blue-500/25",
      darkTextGlow: darkMode ? "text-blue-400" : "text-blue-700 font-extrabold",
      badgeBg: "bg-blue-500/15 text-blue-400 border-blue-500/30",
      label: "RESPALDO IA",
      accentLine: "bg-blue-500"
    }
  ];

  return (
    <div className={`p-5 rounded-2xl border ${darkMode ? "border-slate-800" : "border-slate-200"} ${cardBg} shadow-xl my-4 relative overflow-hidden`}>
      {/* Subtle top decoration */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4.5 z-10 relative">
        <h3 className={`text-sm font-black uppercase tracking-wider flex items-center gap-2 ${headingColor}`}>
          <Sparkles className="text-purple-400 animate-pulse" size={16} />
          <span>{isFuture ? "Oráculo Predictivo IA" : "Análisis Retrospectivo IA"} ({selectedHour})</span>
        </h3>
        {onDeleteRecord && (
          <button
            onClick={onDeleteRecord}
            className="text-[10px] bg-red-950/30 text-red-400 px-3 py-1.5 rounded-xl border border-red-900/40 hover:bg-red-900/50 transition-all font-black uppercase tracking-wider"
          >
            Limpiar Registro
          </button>
        )}
      </div>

      <p className={`text-[11px] md:text-xs font-sans font-medium leading-relaxed mb-4.5 ${textColor} z-10 relative`}>
        {isFuture 
          ? `Predicción calculada para las ${selectedHour}. Modelado Bayesiano y Montecarlo en tiempo real.`
          : `Análisis histórico del Oráculo simulado en tiempo real antes de salir el sorteo de las ${selectedHour}.`
        }
      </p>

      {/* Grid of elegant, polished "Acrylic Plaques" (Placas de Acrílico) */}
      <div className={`grid grid-cols-1 ${animalsCount === 2 ? "md:grid-cols-2" : "md:grid-cols-3"} gap-4.5 z-10 relative`}>
        {monteCarlo.probabilityCloud.slice(0, animalsCount).map((item, idx) => {
          const theme = PLAQUE_THEMES[idx] || PLAQUE_THEMES[2];
          return (
            <div
              key={item.code}
              className={`group relative overflow-hidden rounded-2xl border border-t-white/10 ${theme.border} ${theme.bg} ${theme.glow} p-3.5 flex items-center gap-3.5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}
            >
              {/* Glossy sheen reflection layer */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/10 via-transparent to-white/5 opacity-50" />
              <div className="absolute top-0 left-0 bottom-0 w-[4px] rounded-l-md pointer-events-none z-15">
                <div className={`w-full h-full ${theme.accentLine}`} />
              </div>

              {/* Left Side: Acrylic circle frame with emoji */}
              <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border ${theme.avatarBg} shadow-inner shrink-0 z-10 overflow-hidden`}>
                {/* Shiny glass overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                <span className="text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] select-none transform group-hover:scale-110 transition-transform duration-200">
                  {item.emoji}
                </span>
              </div>

              {/* Middle & Right Details Area */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-12 z-10">
                {/* Top: Name & Code */}
                <div className="flex items-center justify-between gap-2 leading-none">
                  <span className={`font-black uppercase tracking-tight text-xs truncate ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
                    {item.name}
                  </span>
                  <span className={`font-mono text-[11px] font-black shrink-0 ${theme.darkTextGlow}`}>
                    [{item.code}]
                  </span>
                </div>

                {/* Bottom: Model Type Badge & Percentage */}
                <div className="flex items-center justify-between gap-2 mt-auto leading-none">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border tracking-wider uppercase ${theme.badgeBg}`}>
                    {theme.label}
                  </span>
                  
                  <div className="flex items-center gap-0.5 text-right font-mono font-black">
                    <span className={`text-xs ${theme.darkTextGlow}`}>
                      {item.percentage.toFixed(1)}
                    </span>
                    <span className="text-[9px] text-slate-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

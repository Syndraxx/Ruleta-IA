import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, TrendingUp, RefreshCw, HelpCircle, Award, Compass } from "lucide-react";
import { ANIMALITOS } from "../animalitos";

interface SynergyNetworkWidgetProps {
  historialAgente: any[];
  baseAnimal: string;
  concurrencyTarget1: string;
  concurrencyTarget2: string;
  concurrencyTarget3: string;
  onSelectBaseAnimal: (code: string) => void;
  darkMode: boolean;
  playSound: (type: string) => void;
}

export const SynergyNetworkWidget: React.FC<SynergyNetworkWidgetProps> = ({
  historialAgente,
  baseAnimal,
  concurrencyTarget1,
  concurrencyTarget2,
  concurrencyTarget3,
  onSelectBaseAnimal,
  darkMode,
  playSound,
}) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  // Normalization logic
  const normalize = (c: string): string => {
    if (!c) return "";
    if (c === "0" || c === "00") return c;
    const num = parseInt(c, 10);
    if (isNaN(num)) return c;
    return num < 10 ? `0${num}` : num.toString();
  };

  const coreCodes = useMemo(() => {
    return Array.from(new Set([
      normalize(baseAnimal),
      normalize(concurrencyTarget1),
      normalize(concurrencyTarget2),
      normalize(concurrencyTarget3)
    ].filter(Boolean)));
  }, [baseAnimal, concurrencyTarget1, concurrencyTarget2, concurrencyTarget3]);

  // Compute 7-day network data
  const networkData = useMemo(() => {
    // 1. Get the last 7 distinct dates with records
    const uniqueDates = Array.from(new Set(historialAgente.map((h: any) => h.fecha)));
    uniqueDates.sort((a, b) => b.localeCompare(a));
    const top7Dates = uniqueDates.slice(0, 7);

    const last7DaysRecords = historialAgente.filter((h: any) => top7Dates.includes(h.fecha));

    // 2. Group into daily lottery groups
    const groups: Record<string, string[]> = {};
    last7DaysRecords.forEach((item: any) => {
      const key = `${item.fecha}_${item.loteria}`;
      if (!groups[key]) groups[key] = [];
      const code = normalize(item.numero);
      if (code && !groups[key].includes(code)) {
        groups[key].push(code);
      }
    });

    const dailyGroups = Object.values(groups);

    // 3. Count co-occurrences of all pairs
    const pairCounts: Record<string, number> = {};
    const coreCoOccurrences: Record<string, number> = {};

    dailyGroups.forEach((group) => {
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i];
          const b = group[j];
          const sortedPair = [a, b].sort().join("-");
          pairCounts[sortedPair] = (pairCounts[sortedPair] || 0) + 1;

          // Track co-occurrences specifically connected to core nodes
          if (coreCodes.includes(a)) {
            if (b !== a) coreCoOccurrences[b] = (coreCoOccurrences[b] || 0) + 1;
          }
          if (coreCodes.includes(b)) {
            if (a !== b) coreCoOccurrences[a] = (coreCoOccurrences[a] || 0) + 1;
          }
        }
      }
    });

    // 4. Select top 6 non-core animals with highest co-occurrences with any core animal
    const nonCoreConnected = Object.entries(coreCoOccurrences)
      .filter(([code]) => !coreCodes.includes(code))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([code]) => code);

    const allNodeCodes = Array.from(new Set([...coreCodes, ...nonCoreConnected]));

    // 5. Build final nodes list
    const nodes = allNodeCodes.map((code) => {
      const info = ANIMALITOS[code] || { name: `Animal ${code}`, emoji: "🐾", color: "bg-slate-100 border-slate-300 text-slate-900" };
      const isBase = normalize(baseAnimal) === code;
      const isTarget = !isBase && (
        normalize(concurrencyTarget1) === code || 
        normalize(concurrencyTarget2) === code || 
        normalize(concurrencyTarget3) === code
      );

      // Total times this animal was drawn in the last 7 days groups
      const totalGroupOccurrences = dailyGroups.filter(g => g.includes(code)).length;

      return {
        id: code,
        name: info.name,
        emoji: info.emoji,
        colorClass: info.color,
        isBase,
        isTarget,
        isCore: coreCodes.includes(code),
        totalGroupOccurrences
      };
    });

    // 6. Build links list
    const links: Array<{ source: string; target: string; count: number }> = [];
    for (let i = 0; i < allNodeCodes.length; i++) {
      for (let j = i + 1; j < allNodeCodes.length; j++) {
        const u = allNodeCodes[i];
        const v = allNodeCodes[j];
        const pairKey = [u, v].sort().join("-");
        const count = pairCounts[pairKey] || 0;
        if (count > 0) {
          links.push({
            source: u,
            target: v,
            count
          });
        }
      }
    }

    // Determine strongest link
    let strongestLink: { pair: string[]; count: number } | null = null;
    Object.entries(pairCounts).forEach(([pairStr, count]) => {
      const parts = pairStr.split("-");
      if (allNodeCodes.includes(parts[0]) && allNodeCodes.includes(parts[1])) {
        if (!strongestLink || count > strongestLink.count) {
          strongestLink = { pair: parts, count };
        }
      }
    });

    // Determine most active/social animal
    let mostSocialAnimal: { code: string; totalCoOccurrences: number } | null = null;
    allNodeCodes.forEach((code) => {
      let sum = 0;
      links.forEach(l => {
        if (l.source === code || l.target === code) {
          sum += l.count;
        }
      });
      if (!mostSocialAnimal || sum > mostSocialAnimal.totalCoOccurrences) {
        mostSocialAnimal = { code, totalCoOccurrences: sum };
      }
    });

    return {
      nodes,
      links,
      totalGroups: dailyGroups.length,
      last7Dates: top7Dates,
      strongestLink,
      mostSocialAnimal
    };
  }, [historialAgente, baseAnimal, concurrencyTarget1, concurrencyTarget2, concurrencyTarget3, coreCodes]);

  // Network layout math (Dynamic X, Y coordinates inside 500x500 box)
  const layout = useMemo(() => {
    const center = { x: 250, y: 250 };
    const R1 = 95;  // Inner circle radius for core nodes
    const R2 = 180; // Outer circle radius for non-core nodes

    const innerNodes = networkData.nodes.filter(n => n.isCore);
    const outerNodes = networkData.nodes.filter(n => !n.isCore);

    const positions: Record<string, { x: number; y: number }> = {};

    innerNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI) / (innerNodes.length || 1) - Math.PI / 2;
      positions[node.id] = {
        x: center.x + R1 * Math.cos(angle),
        y: center.y + R1 * Math.sin(angle)
      };
    });

    outerNodes.forEach((node, idx) => {
      const angle = (idx * 2 * Math.PI) / (outerNodes.length || 1) + Math.PI / 6;
      positions[node.id] = {
        x: center.x + R2 * Math.cos(angle),
        y: center.y + R2 * Math.sin(angle)
      };
    });

    return positions;
  }, [networkData.nodes]);

  const handleNodeClick = (code: string) => {
    playSound("click");
    onSelectBaseAnimal(code);
    setSelectedNodeId(code);
    setTimeout(() => setSelectedNodeId(null), 800);
  };

  const getAfinidadConBase = useMemo(() => {
    const currentBase = normalize(baseAnimal);
    const list: Array<{ code: string; count: number; name: string; emoji: string }> = [];
    
    networkData.links.forEach(l => {
      let targetCode = "";
      if (l.source === currentBase) targetCode = l.target;
      else if (l.target === currentBase) targetCode = l.source;

      if (targetCode) {
        const meta = ANIMALITOS[targetCode] || { name: `Animal ${targetCode}`, emoji: "🐾" };
        list.push({
          code: targetCode,
          count: l.count,
          name: meta.name,
          emoji: meta.emoji
        });
      }
    });

    return list.sort((a, b) => b.count - a.count);
  }, [networkData.links, baseAnimal]);

  const cardBgClass = darkMode ? "bg-[#0f172a] border-slate-800/80 text-white" : "bg-white border-slate-150 text-slate-900";
  const innerCardBgClass = darkMode ? "bg-[#0a0f1d] border-slate-800/50" : "bg-slate-50 border-slate-100";
  const textMutedClass = darkMode ? "text-slate-400" : "text-slate-500";
  const titleClass = darkMode ? "text-amber-400" : "text-amber-600";

  if (historialAgente.length === 0) {
    return (
      <div className={`p-6 rounded-2xl border ${cardBgClass} text-center select-none`}>
        <TrendingUp className="mx-auto text-amber-500 animate-pulse mb-3" size={28} />
        <h4 className="font-extrabold text-sm uppercase tracking-wider">Red de Sinergias No Disponible</h4>
        <p className={`text-xs mt-1.5 max-w-md mx-auto leading-relaxed ${textMutedClass}`}>
          Agrega sorteos en el panel de control o importa un historial de juego para analizar y graficar la red de co-ocurrencias en tiempo real.
        </p>
      </div>
    );
  }

  return (
    <div id="red-sinergia-widget" className={`p-5 md:p-6 rounded-2xl border shadow-xl flex flex-col gap-5 relative overflow-hidden transition-all duration-300 ${cardBgClass}`}>
      
      {/* Upper Glow decoration for dark mode */}
      {darkMode && (
        <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent blur-[1px]"></div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <Compass size={18} className="animate-spin-slow" />
            </span>
            <h3 className={`text-sm md:text-base font-black uppercase tracking-wide flex items-center gap-1.5 ${titleClass}`}>
              CONCURRENCIA CRUZADA & RED DE CO-OCURRECIAS (7 DÍAS)
            </h3>
          </div>
          <p className={`text-[11px] md:text-xs mt-1 leading-relaxed ${textMutedClass}`}>
            Explora qué animales han aparecido juntos con tu **Base** ({baseAnimal}) y las **Sinergias** ({concurrencyTarget1}, {concurrencyTarget2}, {concurrencyTarget3}). Pulsa cualquier nodo para reenfocar.
          </p>
        </div>

        <div className="flex gap-2 self-start md:self-center shrink-0">
          <button
            onClick={() => {
              playSound("click");
              setShowExplanation(!showExplanation);
            }}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 transition-all ${
              showExplanation
                ? "bg-amber-500 text-slate-950 border-amber-500 shadow-lg"
                : darkMode
                  ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <HelpCircle size={12} />
            {showExplanation ? "Ocultar Guía" : "¿Cómo Funciona?"}
          </button>
        </div>
      </div>

      {/* EXPLANATION BOX */}
      <AnimatePresence>
        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`overflow-hidden rounded-xl border border-dashed text-xs leading-relaxed p-4 flex flex-col gap-2 ${innerCardBgClass}`}
          >
            <div className="flex items-center gap-1.5 font-bold text-amber-500">
              <Sparkles size={14} className="animate-pulse" />
              <span>SISTEMA DE REDES DE AFINIDAD TEMPORAL</span>
            </div>
            <p className={textMutedClass}>
              Esta gráfica visual representa una red de co-ocurrencia calculada a partir de los datos históricos guardados del dispositivo. El sistema toma los sorteos de las últimas <strong>7 jornadas (días activos)</strong> y agrupa los animales que aparecieron en la misma fecha y la misma lotería.
            </p>
            <ul className={`list-disc pl-4 space-y-1 ${textMutedClass}`}>
              <li>
                <strong className="text-amber-500">Nodo Central Base (Estrella Dorada 🌟)</strong>: Representa tu animalito base seleccionado actualmente.
              </li>
              <li>
                <strong className="text-purple-400">Nodos de Sinergia Cruzada (Púrpura 🔮)</strong>: Representan las tres sinergias activas del Motor de Concurrencia Cruzada.
              </li>
              <li>
                <strong className="text-blue-400">Líneas de Conexión (Grosor y Luminosidad)</strong>: Indican la cantidad de veces que dos animales han salido ganadores en un mismo día. Cuanto más brillante y gruesa sea la línea, mayor es su afinidad de salida.
              </li>
              <li>
                <strong>Navegación Interactiva</strong>: Pasa el cursor por encima de un animal para aislar sus relaciones. Haz clic en cualquiera de ellos para fijarlo como nuevo animal base en tu cuaderno de trilogías.
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER: DIAGRAM + STATS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COMPONENT: NETWORK SVG GRAPH */}
        <div className={`col-span-12 lg:col-span-7 flex flex-col items-center justify-center rounded-2xl border p-4 relative overflow-hidden select-none min-h-[350px] ${innerCardBgClass}`}>
          
          {/* Legend indicators overlay inside graph */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 bg-[#000000]/10 dark:bg-[#000000]/40 p-2.5 rounded-xl border border-slate-800/10 backdrop-blur-sm text-[9px] font-black tracking-wider uppercase font-sans">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse border border-black" />
              <span>Base Principal (🌟)</span>
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse border border-black" />
              <span>Sinergias Motor (🔮)</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-500 border border-black" />
              <span>Conexiones Fuertes (🔗)</span>
            </div>
          </div>

          {/* Quick reset/info overlay */}
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-slate-500 bg-[#000000]/5 dark:bg-[#000000]/30 px-2 py-1 rounded">
            Últimos 7 días activos
          </div>

          {/* The Network SVG */}
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 500 500"
            className="w-full max-w-[420px] aspect-square"
          >
            <defs>
              <linearGradient id="baseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>

              <linearGradient id="targetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>

            {/* DRAW EDGES / LINKS FIRST (So nodes render on top) */}
            <g>
              {networkData.links.map((link, idx) => {
                const start = layout[link.source];
                const end = layout[link.target];

                if (!start || !end) return null;

                // Determine if this link is highlighted or dimmed
                const isDirectConnection = hoveredNodeId 
                  ? (link.source === hoveredNodeId || link.target === hoveredNodeId)
                  : true;

                const opacity = hoveredNodeId 
                  ? (isDirectConnection ? 0.95 : 0.08) 
                  : link.count >= 3 ? 0.8 : link.count === 2 ? 0.55 : 0.25;

                // Color based on co-occurrence density
                let strokeColor = darkMode ? "#334155" : "#cbd5e1"; // default slate
                let isStrong = false;

                if (link.source === normalize(baseAnimal) || link.target === normalize(baseAnimal)) {
                  strokeColor = "#f59e0b"; // base link is gold
                  isStrong = true;
                } else if (coreCodes.includes(link.source) || coreCodes.includes(link.target)) {
                  strokeColor = "#a855f7"; // synergy target link is purple
                } else if (link.count >= 3) {
                  strokeColor = "#10b981"; // other strong is emerald
                  isStrong = true;
                }

                const strokeWidth = link.count >= 3 ? 4 : link.count === 2 ? 2.5 : 1.25;

                return (
                  <g key={`link-${idx}`}>
                    {/* Background wider glowing line on hover or strong link */}
                    {((hoveredNodeId && isDirectConnection) || isStrong) && (
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={end.x}
                        y2={end.y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth + 5}
                        strokeOpacity={opacity * 0.15}
                        className="transition-all duration-300"
                      />
                    )}
                    <line
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeOpacity={opacity}
                      strokeDasharray={link.count === 1 ? "4 4" : undefined}
                      className="transition-all duration-300"
                    />
                    {/* Tiny visual pulse badge along the line if it is extremely strong */}
                    {link.count >= 3 && !hoveredNodeId && (
                      <circle
                        r="3.5"
                        fill="#10b981"
                        className="animate-ping"
                        style={{
                          transformBox: "fill-box",
                          transformOrigin: "center",
                          animationDuration: `${3 - link.count * 0.4}s`
                        }}
                      >
                        <animateMotion
                          dur={`${4 - link.count * 0.5}s`}
                          repeatCount="indefinite"
                          path={`M ${start.x} ${start.y} L ${end.x} ${end.y}`}
                        />
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* DRAW NODES */}
            <g>
              {networkData.nodes.map((node) => {
                const pos = layout[node.id];
                if (!pos) return null;

                const isHovered = hoveredNodeId === node.id;
                const isDirectlyConnectedToHovered = hoveredNodeId
                  ? networkData.links.some(l => 
                      (l.source === hoveredNodeId && l.target === node.id) ||
                      (l.target === hoveredNodeId && l.source === node.id)
                    )
                  : false;

                const isDimmed = hoveredNodeId && !isHovered && !isDirectlyConnectedToHovered;
                const nodeOpacity = isDimmed ? 0.3 : 1;
                const isSelected = selectedNodeId === node.id;

                // Scale up when hovered or selected
                const radius = node.isBase ? 32 : node.isTarget ? 26 : 22;
                const scaleFactor = isHovered ? 1.15 : isSelected ? 1.25 : 1;

                return (
                  <g
                    key={`node-${node.id}`}
                    transform={`translate(${pos.x}, ${pos.y}) scale(${scaleFactor})`}
                    className="cursor-pointer transition-all duration-300 select-none"
                    onClick={() => handleNodeClick(node.id)}
                    onMouseEnter={() => setHoveredNodeId(node.id)}
                    onMouseLeave={() => setHoveredNodeId(null)}
                  >
                    {/* Ring indicator */}
                    {node.isBase ? (
                      <circle
                        r={radius + 5}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeDasharray="6 4"
                        className="animate-spin-slow opacity-80"
                      />
                    ) : node.isTarget ? (
                      <circle
                        r={radius + 4}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        className="animate-pulse opacity-70"
                      />
                    ) : null}

                    {/* Main Circle background */}
                    <circle
                      r={radius}
                      fill={node.isBase ? "url(#baseGradient)" : node.isTarget ? "url(#targetGradient)" : (darkMode ? "#1e293b" : "#f1f5f9")}
                      stroke={node.isBase ? "#ffffff" : node.isTarget ? "#c084fc" : (darkMode ? "#475569" : "#cbd5e1")}
                      strokeWidth={node.isBase || node.isTarget ? 2 : 1.5}
                      className="shadow-md transition-all duration-300"
                      style={{ opacity: nodeOpacity }}
                    />

                    {/* Emoji */}
                    <text
                      y={node.isBase ? -5 : (node.isTarget ? -3 : -2)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={node.isBase ? "20" : "16"}
                      className="filter drop-shadow select-none pointer-events-none"
                      style={{ opacity: nodeOpacity }}
                    >
                      {node.emoji}
                    </text>

                    {/* Animal Code Code Text */}
                    <text
                      y={node.isBase ? 15 : (node.isTarget ? 12 : 11)}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={node.isBase ? "10" : "9"}
                      fontWeight="900"
                      fontFamily="monospace"
                      fill={node.isBase || node.isTarget ? "#ffffff" : (darkMode ? "#cbd5e1" : "#1e293b")}
                      className="pointer-events-none"
                      style={{ opacity: nodeOpacity }}
                    >
                      {node.id}
                    </text>

                    {/* Tiny Star Overlay for base animal */}
                    {node.isBase && (
                      <text
                        x="18"
                        y="-18"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="12"
                        className="filter drop-shadow animate-bounce pointer-events-none"
                      >
                        🌟
                      </text>
                    )}

                    {/* Tiny target indicator for synergy */}
                    {node.isTarget && (
                      <text
                        x="14"
                        y="-14"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize="10"
                        className="filter drop-shadow pointer-events-none"
                      >
                        🔮
                      </text>
                    )}

                    {/* Label (displayed only when hovered or always on base animal) */}
                    {(isHovered || node.isBase) && (
                      <g transform={`translate(0, ${radius + 18})`}>
                        {/* Rounded label box */}
                        <rect
                          x="-45"
                          y="-9"
                          width="90"
                          height="18"
                          rx="6"
                          fill={darkMode ? "#020617" : "#1e293b"}
                          stroke={node.isBase ? "#f59e0b" : "#a855f7"}
                          strokeWidth="1"
                          fillOpacity="0.9"
                        />
                        <text
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize="8.5"
                          fontWeight="900"
                          fill="#ffffff"
                          className="uppercase font-sans tracking-tight pointer-events-none"
                        >
                          {node.name.length > 11 ? `${node.name.slice(0, 9)}..` : node.name}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* RIGHT COMPONENT: STATS & LIST OF SYNERGIES */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          
          {/* QUICK SUMMARY METRICS */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${innerCardBgClass}`}>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${textMutedClass}`}>
                🔗 VÍNCULO MÁS FUERTE
              </span>
              {networkData.strongestLink ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm">
                      {ANIMALITOS[networkData.strongestLink.pair[0]]?.emoji}
                    </span>
                    <span className="font-mono text-xs font-black">
                      {networkData.strongestLink.pair[0]}
                    </span>
                    <span className="text-slate-400 text-[10px]">x</span>
                    <span className="text-sm">
                      {ANIMALITOS[networkData.strongestLink.pair[1]]?.emoji}
                    </span>
                    <span className="font-mono text-xs font-black">
                      {networkData.strongestLink.pair[1]}
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-500 font-extrabold mt-1 uppercase">
                    ⚡ {networkData.strongestLink.count} salidas juntos
                  </span>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-550">Sin coincidencias</span>
              )}
            </div>

            <div className={`p-3 rounded-xl border flex flex-col gap-1 ${innerCardBgClass}`}>
              <span className={`text-[9px] font-bold uppercase tracking-wider ${textMutedClass}`}>
                🦊 ANIMAL MÁS SOCIAL
              </span>
              {networkData.mostSocialAnimal ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base">
                      {ANIMALITOS[networkData.mostSocialAnimal.code]?.emoji}
                    </span>
                    <span className="font-black text-xs">
                      {networkData.mostSocialAnimal.code} - {ANIMALITOS[networkData.mostSocialAnimal.code]?.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-400 font-extrabold mt-1 uppercase">
                    🔗 {networkData.mostSocialAnimal.totalCoOccurrences} co-apariciones
                  </span>
                </div>
              ) : (
                <span className="text-xs font-bold text-slate-550">Sin coincidencias</span>
              )}
            </div>
          </div>

          {/* AFINIDADES DETALLADAS CON LA BASE SELECCIONADA */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 flex-1 ${innerCardBgClass}`}>
            <div className="flex items-center justify-between border-b border-dashed border-slate-700/20 pb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <TrendingUp size={12} className="animate-pulse" />
                AFINIDADES DE TU ANIMAL BASE ({baseAnimal})
              </span>
              <span className="text-[9px] font-mono text-slate-500 bg-slate-900/10 dark:bg-slate-900/50 px-1.5 py-0.2 rounded font-bold">
                {getAfinidadConBase.length} Conexiones
              </span>
            </div>

            {getAfinidadConBase.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-2xl filter drop-shadow opacity-60 mb-2">🐾</span>
                <p className={`text-[11px] leading-relaxed max-w-[200px] ${textMutedClass}`}>
                  No hay sorteos registrados junto al animal base <strong>{baseAnimal}</strong> en los últimos 7 días.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[195px] overflow-y-auto pr-1">
                {getAfinidadConBase.slice(0, 5).map((item, idx) => {
                  const isCoreAffiliation = coreCodes.includes(item.code);
                  
                  return (
                    <div
                      key={item.code}
                      onClick={() => handleNodeClick(item.code)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all hover:translate-x-1 ${
                        isCoreAffiliation
                          ? "bg-purple-500/5 hover:bg-purple-500/10 border-purple-500/20 text-purple-200"
                          : darkMode
                            ? "bg-slate-900/40 hover:bg-slate-900/80 border-slate-800"
                            : "bg-white hover:bg-slate-100 border-slate-200"
                      }`}
                      title={`Fijar ${item.code} - ${item.name} como base principal`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-mono font-black text-[10px] bg-slate-800/10 dark:bg-slate-800/60 w-5 h-5 rounded flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-base leading-none filter drop-shadow">{item.emoji}</span>
                        <span className="font-mono font-extrabold">{item.code}</span>
                        <span className="font-extrabold opacity-90 truncate max-w-[100px]">{item.name}</span>
                        
                        {isCoreAffiliation && (
                          <span className="text-[7.5px] font-black uppercase bg-purple-500/10 border border-purple-500/20 text-purple-400 px-1 py-0.2 rounded font-sans leading-none animate-pulse">
                            SINERGIA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 font-mono font-black">
                        <span className="text-amber-500 text-xs">{item.count}</span>
                        <span className={`text-[9px] uppercase font-sans ${textMutedClass}`}>días juntos</span>
                      </div>
                    </div>
                  );
                })}

                {getAfinidadConBase.length > 5 && (
                  <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-wider mt-1.5">
                    + {getAfinidadConBase.length - 5} conexiones adicionales en la red
                  </p>
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

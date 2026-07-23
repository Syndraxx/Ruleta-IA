import React, { useState, useEffect } from "react";
import { List } from "react-window";
import { Compass, Trash2 } from "lucide-react";

interface HistoryItem {
  fecha: string;
  loteria: string;
  draws: Record<string, string>;
}

interface VirtualizedHistoryListProps {
  items: HistoryItem[];
  darkMode: boolean;
  hoursList: string[];
  ANIMALITOS: Record<string, { name: string; emoji: string }>;
  handleRestoreFromHistoryItem: (item: HistoryItem) => void;
  triggerModalConfirm: (title: string, message: string, onConfirm: () => void) => void;
  setAccumulatedResults: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
  addLog: (msg: string) => void;
  playSound: (soundName: string) => void;
}

export const VirtualizedHistoryList = React.memo(function VirtualizedHistoryList({
  items,
  darkMode,
  hoursList,
  ANIMALITOS,
  handleRestoreFromHistoryItem,
  triggerModalConfirm,
  setAccumulatedResults,
  addLog,
  playSound,
}: VirtualizedHistoryListProps) {
  const [itemHeight, setItemHeight] = useState(90);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemHeight(115); // Mobile (wrapped badges, vertical gap)
      } else {
        setItemHeight(90);  // Tablet/Desktop (inline row)
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const Row = React.useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style} className="p-1">
        <div className="bg-zinc-950/45 border border-white/10 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-white/20 transition-all h-full overflow-hidden select-none">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 truncate">
              <span className="bg-indigo-600/30 text-indigo-300 border border-indigo-500/15 px-2 py-0.5 rounded text-[9px] font-black font-mono">
                {index + 1}°
              </span>
              <span className="text-xs font-extrabold text-white font-mono">
                🗓️ {item.fecha}
              </span>
              <span className="text-[10px] text-yellow-500 font-bold uppercase font-sans">
                {item.loteria}
              </span>
              <span className="text-[8px] text-slate-400 font-mono hidden xs:inline">
                ({Object.values(item.draws).filter(Boolean).length} / 12 sorteos)
              </span>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-1.5 overflow-hidden max-h-[48px]">
              {hoursList.map(h => {
                const code = item.draws[h];
                const anim = code ? ANIMALITOS[code] : null;
                if (anim && code) {
                  return (
                    <div 
                      key={h} 
                      className="flex items-center gap-0.5 px-2 py-0.5 bg-black/50 border border-white/5 rounded-full text-[10px] font-mono hover:scale-105 transition-transform"
                      title={`Sorteo: ${h} - [${code} ${anim.name}]`}
                    >
                      <span className="text-xs leading-none">{anim.emoji}</span>
                      <span className="text-[8.5px] font-black text-yellow-500 leading-none">{code}</span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 border-t sm:border-t-0 border-white/5 pt-1.5 sm:pt-0 shrink-0">
            <button
              onClick={() => handleRestoreFromHistoryItem(item)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-[9px] font-black text-center uppercase tracking-wide rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-all ${
                darkMode ? "bg-blue-600/20 text-blue-300 border border-blue-500/20 hover:bg-blue-600/35" : "bg-blue-105 hover:bg-blue-200 text-blue-992 border-2 border-black comic-shadow-small font-black"
              }`}
            >
              <Compass size={11} />
              <span className="xs:inline">Cargar</span>
            </button>
            <button
              onClick={() => {
                playSound("click");
                triggerModalConfirm(
                  "Eliminar Registro",
                  `¿Estás seguro de que deseas eliminar permanentemente el registro del día ${item.fecha} para ${item.loteria}? Esta acción es irreversible.`,
                  () => {
                    setAccumulatedResults(prev => {
                      const filtered = prev.filter(r => !(r.fecha === item.fecha && r.loteria === item.loteria));
                      localStorage.setItem("ACCUMULATED_SCRAPE_RESULTS", JSON.stringify(filtered));
                      addLog(`HISTORIAL: Eliminado registro del día ${item.fecha} (${item.loteria}).`);
                      return filtered;
                    });
                  }
                );
              }}
              className="px-2 py-1.5 bg-red-950/45 text-red-400 border border-red-900/40 rounded-lg hover:bg-red-950/80 transition-colors cursor-pointer"
              title="Eliminar este día de la base de datos local"
            >
              <Trash2 size={11} />
            </button>
          </div>
        </div>
      </div>
    );
  }, [items, darkMode, hoursList, ANIMALITOS, handleRestoreFromHistoryItem, triggerModalConfirm, setAccumulatedResults, addLog, playSound]);

  if (items.length === 0) {
    return (
      <div className="py-8 text-center text-xs font-bold text-slate-500 font-sans select-none font-sans">
        No hay ningún sorteo guardado aún. ¡Utiliza el scraper o el registro manual para comenzar a acumular tu base de datos!
      </div>
    );
  }

  return (
    <div className="h-62 overflow-hidden pr-1 relative select-none">
      <List<{}, "div">
        rowCount={items.length}
        rowHeight={itemHeight}
        rowComponent={Row}
        rowProps={{}}
        style={{ height: 248 }}
        className="scrollbar-thin scrollbar-thumb-zinc-805"
      />
    </div>
  );
});

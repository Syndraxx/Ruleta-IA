import { ANIMALITOS } from "../../data/animalitos";
import { computeComprehensiveOracle } from "../../utils/predictionEngine";
import { AccumulatedResult, DrawsRecord } from "../../types";

export interface EnginePerformance {
  engine: "Markov" | "Bayes" | "Poisson" | "Monte Carlo";
  hits: number;
  total: number;
  accuracy: number;
}

export interface DayMetaAnalysis {
  fecha: string;
  loteria: string;
  totalDraws: number;
  performances: EnginePerformance[];
  bestEngine: "Markov" | "Bayes" | "Poisson" | "Monte Carlo" | "Ninguno";
  gamePattern: "Rotación" | "Repetición" | "Racha" | "Equilibrado";
  patternExplanation: string;
  hourlyDetails: Array<{
    hour: string;
    actualCode: string;
    actualName: string;
    actualEmoji: string;
    predictions: {
      markov: string[];
      bayesian: string[];
      poisson: string[];
      monteCarlo: string[];
    };
    hits: {
      markov: boolean;
      bayesian: boolean;
      poisson: boolean;
      monteCarlo: boolean;
    };
  }>;
}

/**
 * Realiza un Meta-Análisis retrospectivo detallado para un día específico y lotería dada.
 * Compara los resultados jugados con las predicciones que habrían hecho los 4 motores matemáticos.
 */
export function analyzeDayPredictions(
  accumulatedResults: AccumulatedResult[],
  targetRecord: AccumulatedResult,
  hoursList: string[],
  animalsCount = 3
): DayMetaAnalysis {
  const loteria = targetRecord.loteria;
  const fecha = targetRecord.fecha;

  // 1. Filtrar el historial cronológicamente excluyendo fechas iguales o posteriores para evitar sesgo
  const sortedHistory = [...accumulatedResults]
    .filter((r) => r.loteria === loteria)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  const idxInOriginal = sortedHistory.findIndex((r) => r.fecha === fecha);
  const historyBefore = idxInOriginal !== -1 ? sortedHistory.slice(0, idxInOriginal) : sortedHistory.filter(r => r.fecha < fecha);

  const hourlyDetails: DayMetaAnalysis["hourlyDetails"] = [];
  
  let markovHits = 0;
  let bayesHits = 0;
  let poissonHits = 0;
  let mcHits = 0;
  let totalEvaluatedHours = 0;

  // 2. Evaluar cada hora que tenga un resultado real
  hoursList.forEach((hour) => {
    const actualCode = targetRecord.draws[hour];
    if (!actualCode) return; // Sin sorteo real en esta hora, se ignora

    totalEvaluatedHours++;

    // Reconstruir el estado de sorteos reales para el mismo día ANTES de la hora a evaluar
    const currentDraws: DrawsRecord = {};
    hoursList.forEach((h) => {
      if (hoursList.indexOf(h) < hoursList.indexOf(hour)) {
        currentDraws[h] = targetRecord.draws[h];
      }
    });

    // Ejecutar predicciones con baja cantidad de simulaciones (300) para un cálculo ágil
    const oracle = computeComprehensiveOracle(
      historyBefore,
      currentDraws,
      loteria,
      hour,
      hoursList,
      false,
      fecha,
      300
    );

    // Obtener los mejores candidatos (Top N) de cada motor individualmente
    const markovTop = oracle.markov.order1.slice(0, animalsCount).map((x) => x.code);
    const bayesTop = oracle.bayesian.hotList.slice(0, animalsCount).map((x) => x.code);
    const poissonTop = oracle.poisson.densityList.slice(0, animalsCount).map((x) => x.code);
    const mcTop = oracle.monteCarlo.probabilityCloud.slice(0, animalsCount).map((x) => x.code);

    const isMarkovHit = markovTop.includes(actualCode);
    const isBayesHit = bayesTop.includes(actualCode);
    const isPoissonHit = poissonTop.includes(actualCode);
    const isMcHit = mcTop.includes(actualCode);

    if (isMarkovHit) markovHits++;
    if (isBayesHit) bayesHits++;
    if (isPoissonHit) poissonHits++;
    if (isMcHit) mcHits++;

    const animalInfo = ANIMALITOS[actualCode] || { name: "Desconocido", emoji: "🎲" };

    hourlyDetails.push({
      hour,
      actualCode,
      actualName: animalInfo.name,
      actualEmoji: animalInfo.emoji,
      predictions: {
        markov: markovTop,
        bayesian: bayesTop,
        poisson: poissonTop,
        monteCarlo: mcTop,
      },
      hits: {
        markov: isMarkovHit,
        bayesian: isBayesHit,
        poisson: isPoissonHit,
        monteCarlo: isMcHit,
      },
    });
  });

  // 3. Compilar resultados de rendimiento
  const performances: EnginePerformance[] = [
    {
      engine: "Markov",
      hits: markovHits,
      total: totalEvaluatedHours,
      accuracy: totalEvaluatedHours > 0 ? (markovHits / totalEvaluatedHours) * 100 : 0,
    },
    {
      engine: "Bayes",
      hits: bayesHits,
      total: totalEvaluatedHours,
      accuracy: totalEvaluatedHours > 0 ? (bayesHits / totalEvaluatedHours) * 100 : 0,
    },
    {
      engine: "Poisson",
      hits: poissonHits,
      total: totalEvaluatedHours,
      accuracy: totalEvaluatedHours > 0 ? (poissonHits / totalEvaluatedHours) * 100 : 0,
    },
    {
      engine: "Monte Carlo",
      hits: mcHits,
      total: totalEvaluatedHours,
      accuracy: totalEvaluatedHours > 0 ? (mcHits / totalEvaluatedHours) * 100 : 0,
    },
  ];

  // Determinar el mejor motor del día
  let bestPerf = performances[0];
  performances.forEach((p) => {
    if (p.hits > bestPerf.hits) {
      bestPerf = p;
    }
  });

  const bestEngine = bestPerf.hits > 0 ? bestPerf.engine : "Ninguno";

  // 4. Determinar el "Patrón de Juego" basado en heurísticas matemáticas
  // Analizar redundancia de sorteos (repeticiones del mismo código)
  const drawnCodes = Object.values(targetRecord.draws).filter(Boolean) as string[];
  const uniqueCodes = new Set(drawnCodes);
  const repetitionsCount = drawnCodes.length - uniqueCodes.size;

  let gamePattern: DayMetaAnalysis["gamePattern"] = "Equilibrado";
  let patternExplanation = "";

  if (repetitionsCount > 1) {
    gamePattern = "Repetición";
    patternExplanation = `Se detecta un patrón de REPETICIÓN alto en la ruleta hoy con ${repetitionsCount} duplicaciones de animalitos. El motor Markov y Bayes se adaptan mejor a este comportamiento reactivo.`;
  } else if (bestEngine === "Markov") {
    gamePattern = "Repetición";
    patternExplanation = "La ruleta sigue un patrón de SECUENCIALIDAD (Repetición/Inercia). El motor de Cadenas de Markov está dominando, indicando que el sorteador se adhiere fuertemente a las transiciones históricas tradicionales de primer y segundo orden.";
  } else if (bestEngine === "Bayes") {
    gamePattern = "Racha";
    patternExplanation = "Se observa un patrón de RACHA (Inercia de Corto Plazo). El peso Bayesiano con decaimiento exponencial es el más efectivo hoy, lo que demuestra que los animalitos que salieron recientemente o en días muy cercanos están ejerciendo una atracción dominante hoy.";
  } else if (bestEngine === "Poisson") {
    gamePattern = "Rotación";
    patternExplanation = "La ruleta se comporta bajo un patrón de ROTACIÓN por Horas. La densidad horaria de Poisson es el motor líder, reflejando que el sorteador está respetando las franjas horarias específicas y distribuyendo los resultados de manera cíclica sin repeticiones inmediatas.";
  } else if (bestEngine === "Monte Carlo") {
    gamePattern = "Equilibrado";
    patternExplanation = "El comportamiento es EQUILIBRADO (Multivariable). El simulador integrado de Monte Carlo, que cruza todas las variables probabilísticas de forma ponderada, es el que mejor resultado global está logrando. Patrón estable y recomendado para apuestas diversificadas.";
  } else {
    // Si no hay aciertos de ningún motor
    if (repetitionsCount === 0) {
      gamePattern = "Rotación";
      patternExplanation = "La ruleta está en un estado de ROTACIÓN extrema (Sorteador frío o aleatorio). Ningún motor matemático individual ha logrado un acierto significativo, lo que ocurre cuando el sorteador evita repetir secuencias u horas conocidas.";
    } else {
      gamePattern = "Equilibrado";
      patternExplanation = "Comportamiento mixto inusual. El sorteador combina elementos de inercia y distribución sin que ningún algoritmo de predicción tome una ventaja clara. Se sugiere precaución y calibración equilibrada.";
    }
  }

  return {
    fecha,
    loteria,
    totalDraws: totalEvaluatedHours,
    performances,
    bestEngine,
    gamePattern,
    patternExplanation,
    hourlyDetails,
  };
}

/**
 * Guarda o recupera el historial de meta-análisis en el LocalStorage
 * para permitir llevar una auditoría histórica persistente del rendimiento diario de los motores.
 */
const STORAGE_KEY = "RU_PRO_META_ANALYSIS_HISTORY_V1";

export function getSavedMetaAnalysisHistory(): Record<string, DayMetaAnalysis> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.error("Error al cargar historial de meta-análisis:", e);
    return {};
  }
}

export function saveMetaAnalysisToHistory(analysis: DayMetaAnalysis): void {
  try {
    const history = getSavedMetaAnalysisHistory();
    const key = `${analysis.fecha}_${analysis.loteria.toUpperCase().replace(/\s+/g, "_")}`;
    history[key] = analysis;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Error al guardar meta-análisis:", e);
  }
}

export function clearMetaAnalysisHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

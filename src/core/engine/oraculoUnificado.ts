import { calculateMarkovTransitions } from "../predictors/markov";
import { calculateBayesianWeights } from "../predictors/bayes";
import { calculatePoissonHourDensity } from "../predictors/poisson";
import { runMonteCarloOracle } from "../predictors/monteCarlo";
import { ComprehensiveOracleResult } from "../schemas/types";

/**
 * Procesa el historial de sorteos cronológicamente para obtener la secuencia exacta de animalitos
 */
export function getSequenceOfDraws(
  accumulatedResults: any[],
  currentDraws: Record<string, string | null>,
  loteria: string,
  selectedHour: string,
  hoursList: string[],
  isNextDayFirstHour = false,
  currentDate?: string
): {
  sequence: string[];
  lastCode: string | null;
  prevCode: string | null;
} {
  const sequence: string[] = [];

  // 1. Filtrar registros históricos excluyendo hoy para evitar sesgos en el pasado
  const filtered = accumulatedResults
    .filter((r) => r.loteria === loteria && (!currentDate || r.fecha !== currentDate))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // 2. Adjuntar resultados en secuencia por horario
  filtered.forEach((record) => {
    hoursList.forEach((h) => {
      const code = record.draws?.[h];
      if (code) {
        sequence.push(code);
      }
    });
  });

  // 3. Adjuntar resultados de hoy
  if (isNextDayFirstHour) {
    hoursList.forEach((h) => {
      const code = currentDraws[h];
      if (code) {
        sequence.push(code);
      }
    });
  } else {
    const selectedIdx = hoursList.indexOf(selectedHour);
    for (let i = 0; i < selectedIdx; i++) {
      const code = currentDraws[hoursList[i]];
      if (code) {
        sequence.push(code);
      }
    }
  }

  let lastCode: string | null = null;
  let prevCode: string | null = null;

  if (isNextDayFirstHour) {
    const todayPastCodes: string[] = [];
    hoursList.forEach((h) => {
      const code = currentDraws[h];
      if (code) {
        todayPastCodes.push(code);
      }
    });
    lastCode = todayPastCodes.length > 0 ? todayPastCodes[todayPastCodes.length - 1] : null;
    prevCode = todayPastCodes.length > 1 ? todayPastCodes[todayPastCodes.length - 2] : null;
  } else {
    const selectedIdx = hoursList.indexOf(selectedHour);
    const todayPastCodes: string[] = [];
    for (let i = 0; i < selectedIdx; i++) {
      const code = currentDraws[hoursList[i]];
      if (code) {
        todayPastCodes.push(code);
      }
    }
    if (todayPastCodes.length > 0) {
      lastCode = todayPastCodes[todayPastCodes.length - 1];
      prevCode = todayPastCodes.length > 1 ? todayPastCodes[todayPastCodes.length - 2] : null;
    } else {
      // Buscar el fin del día anterior
      if (filtered.length > 0) {
        const yesterdayRecord = filtered[filtered.length - 1];
        const yesterdayPastCodes: string[] = [];
        hoursList.forEach((h) => {
          const code = yesterdayRecord.draws?.[h];
          if (code) {
            yesterdayPastCodes.push(code);
          }
        });
        lastCode = yesterdayPastCodes.length > 0 ? yesterdayPastCodes[yesterdayPastCodes.length - 1] : null;
        prevCode = yesterdayPastCodes.length > 1 ? yesterdayPastCodes[yesterdayPastCodes.length - 2] : null;
      }
    }
  }

  return { sequence, lastCode, prevCode };
}

const oracleCache = new Map<string, ComprehensiveOracleResult>();

/**
 * Genera una clave única de caché para evitar cálculos matemáticos innecesarios
 */
export function getOracleCacheKey(
  accumulatedResults: any[],
  currentDraws: Record<string, string | null>,
  loteria: string,
  selectedHour: string,
  isNextDayFirstHour: boolean,
  currentDate?: string,
  calibrationProfile = "equilibrado"
): string {
  const relevantHistory = accumulatedResults
    .filter((r) => r.loteria === loteria)
    .map((r) => `${r.fecha}:${Object.entries(r.draws || {}).map(([k, v]) => `${k}=${v}`).join("|")}`)
    .join(";");

  const drawsSerialized = Object.entries(currentDraws || {})
    .sort()
    .map(([k, v]) => `${k}:${v || "null"}`)
    .join(",");

  return `${loteria}_${selectedHour}_${isNextDayFirstHour}_${currentDate || "no_date"}_[${drawsSerialized}]_[${relevantHistory}]_${calibrationProfile}`;
}

export function clearUnifiedOracleCache(): void {
  oracleCache.clear();
  console.log("🔮 [Unified Oracle Cache] Memoria intermedia vaciada.");
}

/**
 * Función máster del Oráculo que calcula e integra todos los submódulos predictivos
 */
export function computeComprehensiveOracle(
  accumulatedResults: any[],
  currentDraws: Record<string, string | null>,
  loteria: string,
  selectedHour: string,
  hoursList: string[],
  isNextDayFirstHour = false,
  currentDate?: string,
  simulationsRun?: number,
  calibrationProfile = "equilibrado"
): ComprehensiveOracleResult {
  const cacheKey = getOracleCacheKey(
    accumulatedResults,
    currentDraws,
    loteria,
    selectedHour,
    isNextDayFirstHour,
    currentDate,
    calibrationProfile
  );

  if (oracleCache.has(cacheKey)) {
    console.log(`🔮 [Oracle Unified Cache] HIT para ${loteria} - ${selectedHour}`);
    return oracleCache.get(cacheKey)!;
  }

  // Si estamos en entorno servidor, por defecto realizamos 10,000 simulaciones, en navegador 2,000
  const activeSims = simulationsRun !== undefined
    ? simulationsRun
    : (typeof window === "undefined" ? 10000 : 2000);

  console.log(`🔮 [Oracle Unified Cache] MISS para ${loteria} - ${selectedHour}. Calculando con Monte Carlo (${activeSims})...`);

  const { sequence, lastCode, prevCode } = getSequenceOfDraws(
    accumulatedResults,
    currentDraws,
    loteria,
    selectedHour,
    hoursList,
    isNextDayFirstHour,
    currentDate
  );

  const appearedToday: string[] = [];
  if (currentDraws) {
    Object.values(currentDraws).forEach((val) => {
      if (val) appearedToday.push(val);
    });
  }

  const markov = calculateMarkovTransitions(sequence, lastCode, prevCode);
  const bayesian = calculateBayesianWeights(sequence, 0.05);
  const poisson = calculatePoissonHourDensity(
    accumulatedResults,
    loteria,
    isNextDayFirstHour ? hoursList[0] : selectedHour,
    currentDate
  );
  const monteCarlo = runMonteCarloOracle(markov, bayesian, poisson, activeSims, calibrationProfile, appearedToday);

  const result: ComprehensiveOracleResult = {
    markov,
    bayesian,
    poisson,
    monteCarlo,
  };

  oracleCache.set(cacheKey, result);
  return result;
}

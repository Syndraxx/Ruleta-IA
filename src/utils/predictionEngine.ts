import { ANIMALITOS } from "../data/animalitos";

// All canonical animal codes
export const ALL_ANIMAL_CODES = Object.keys(ANIMALITOS);
const ALL_CODES_LEN = ALL_ANIMAL_CODES.length;

export interface MarkovResult {
  order1: Array<{ code: string; name: string; emoji: string; count: number; prob: number }>;
  order2: Array<{ code: string; name: string; emoji: string; count: number; prob: number }>;
  activeOrder1Seed: boolean;
  activeOrder2Seed: boolean;
  lastAnimal: { code: string; name: string; emoji: string } | null;
  prevAnimal: { code: string; name: string; emoji: string } | null;
}

export interface BayesianResult {
  hotList: Array<{ code: string; name: string; emoji: string; weightScore: number; percentage: number }>;
  decayFactorUsed: number;
}

export interface PoissonResult {
  criticalHour: string;
  densityList: Array<{ code: string; name: string; emoji: string; lambda: number; prob: number }>;
}

export interface MonteCarloResult {
  simulationsRun: number;
  probabilityCloud: Array<{ code: string; name: string; emoji: string; hits: number; percentage: number }>;
}

export interface ComprehensiveOracleResult {
  markov: MarkovResult;
  bayesian: BayesianResult;
  poisson: PoissonResult;
  monteCarlo: MonteCarloResult;
}

/**
 * getSequenceOfDraws
 * - Mantiene la semántica original pero evita llamadas repetidas a indexOf y reduce allocations temporales.
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

  // Filter + sort once
  const filtered = accumulatedResults
    .filter((r) => r.loteria === loteria && (!currentDate || r.fecha !== currentDate))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // Append historical draws (one pass per record, inner loop is hoursList with direct access)
  for (let i = 0; i < filtered.length; i++) {
    const record = filtered[i];
    for (let j = 0; j < hoursList.length; j++) {
      const h = hoursList[j];
      const code = record.draws?.[h];
      if (code) sequence.push(code);
    }
  }

  // Append today's draws up to selectedHour (or whole day if next-day-first)
  if (isNextDayFirstHour) {
    for (let j = 0; j < hoursList.length; j++) {
      const h = hoursList[j];
      const code = currentDraws[h];
      if (code) sequence.push(code);
    }
  } else {
    const selectedIdx = hoursList.indexOf(selectedHour);
    for (let i = 0; i < selectedIdx; i++) {
      const code = currentDraws[hoursList[i]];
      if (code) sequence.push(code);
    }
  }

  // Compute lastCode & prevCode with minimal extra scans
  let lastCode: string | null = null;
  let prevCode: string | null = null;

  if (isNextDayFirstHour) {
    // last two codes from today's filled hours
    for (let i = hoursList.length - 1; i >= 0; i--) {
      const c = currentDraws[hoursList[i]];
      if (!c) continue;
      if (!lastCode) lastCode = c;
      else if (!prevCode) {
        prevCode = c;
        break;
      }
    }
  } else {
    // check today's prior codes first (before selectedHour)
    const selectedIdx = hoursList.indexOf(selectedHour);
    for (let i = selectedIdx - 1; i >= 0; i--) {
      const c = currentDraws[hoursList[i]];
      if (!c) continue;
      if (!lastCode) lastCode = c;
      else if (!prevCode) {
        prevCode = c;
        break;
      }
    }
    // If none found, look at latest historical record (yesterday)
    if (!lastCode && filtered.length > 0) {
      const lastRecord = filtered[filtered.length - 1];
      for (let i = hoursList.length - 1; i >= 0; i--) {
        const c = lastRecord.draws?.[hoursList[i]];
        if (!c) continue;
        if (!lastCode) lastCode = c;
        else if (!prevCode) {
          prevCode = c;
          break;
        }
      }
    }
  }

  return { sequence, lastCode, prevCode };
}

/**
 * calculateMarkovTransitions
 * - Un único recorrido (hasta length-2) que calcula tanto order1 como order2; evita múltiples pasadas.
 */
export function calculateMarkovTransitions(
  sequence: string[],
  lastCode: string | null,
  prevCode: string | null
): MarkovResult {
  const order1Counts: Record<string, number> = {};
  const order2Counts: Record<string, number> = {};
  let totalOrder1 = 0;
  let totalOrder2 = 0;

  // Initialize count maps once
  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const c = ALL_ANIMAL_CODES[i];
    order1Counts[c] = 0;
    order2Counts[c] = 0;
  }

  // Single pass to gather transitions
  for (let i = 0; i < sequence.length - 1; i++) {
    const cur = sequence[i];
    const next = sequence[i + 1];
    if (lastCode && cur === lastCode) {
      if (order1Counts[next] !== undefined) {
        order1Counts[next]++;
        totalOrder1++;
      }
    }
    if (prevCode && lastCode && i < sequence.length - 2) {
      // check pair for order2
      if (cur === prevCode && sequence[i + 1] === lastCode) {
        const next2 = sequence[i + 2];
        if (order2Counts[next2] !== undefined) {
          order2Counts[next2]++;
          totalOrder2++;
        }
      }
    }
  }

  // Edge-case: if lastCode occurs only at last position (no next), original algorithm wouldn't count — preserved.

  let activeOrder1Seed = false;
  let activeOrder2Seed = false;

  // Seeding logic preserved but with small micro-optimizations
  if (totalOrder1 < 3 && lastCode) {
    activeOrder1Seed = true;
    const baseVal = lastCode === "00" ? 37 : parseInt(lastCode, 10);
    for (let k = 0; k < 3; k++) {
      const offset = (k + 1) * 11;
      const codeStr = ((baseVal + offset) % 38).toString().padStart(2, "0");
      const normalizedCode = codeStr === "37" ? "00" : codeStr;
      if (order1Counts[normalizedCode] !== undefined) {
        order1Counts[normalizedCode] += 5;
        totalOrder1 += 5;
      }
    }
  }

  if (totalOrder2 < 2 && lastCode) {
    activeOrder2Seed = true;
    // Use order1Counts as seed for order2 to avoid extra heuristics
    for (let i = 0; i < ALL_CODES_LEN; i++) {
      const c = ALL_ANIMAL_CODES[i];
      const v = order1Counts[c] || 1;
      order2Counts[c] = v;
      totalOrder2 += v;
    }
  }

  // Build sorted lists
  const order1 = new Array(ALL_CODES_LEN);
  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const code = ALL_ANIMAL_CODES[i];
    const meta = ANIMALITOS[code];
    const count = order1Counts[code] || 0;
    const prob = totalOrder1 > 0 ? count / totalOrder1 : 1 / ALL_CODES_LEN;
    order1[i] = {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      count,
      prob,
    };
  }
  order1.sort((a, b) => b.prob - a.prob);

  const order2 = new Array(ALL_CODES_LEN);
  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const code = ALL_ANIMAL_CODES[i];
    const meta = ANIMALITOS[code];
    const count = order2Counts[code] || 0;
    const prob = totalOrder2 > 0 ? count / totalOrder2 : 1 / ALL_CODES_LEN;
    order2[i] = {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      count,
      prob,
    };
  }
  order2.sort((a, b) => b.prob - a.prob);

  const lastMeta = lastCode ? ANIMALITOS[lastCode] : null;
  const prevMeta = prevCode ? ANIMALITOS[prevCode] : null;

  return {
    order1,
    order2,
    activeOrder1Seed,
    activeOrder2Seed,
    lastAnimal: lastCode ? { code: lastCode, name: lastMeta?.name || "N/A", emoji: lastMeta?.emoji || "🎲" } : null,
    prevAnimal: prevCode ? { code: prevCode, name: prevMeta?.name || "N/A", emoji: prevMeta?.emoji || "🎲" } : null,
  };
}

/**
 * calculateBayesianWeights
 * - Reduce calls to Math.exp by computing initial weight and multiplying by a factor each step.
 */
export function calculateBayesianWeights(
  sequence: string[],
  decayFactor = 0.04
): BayesianResult {
  const scores: Record<string, number> = {};
  for (let i = 0; i < ALL_CODES_LEN; i++) scores[ALL_ANIMAL_CODES[i]] = 0;

  const N = sequence.length;
  if (N === 0) {
    // uniform seed
    const hotList = ALL_ANIMAL_CODES.map((code) => {
      const meta = ANIMALITOS[code];
      return { code, name: meta?.name || "Desconocido", emoji: meta?.emoji || "🎲", weightScore: 1, percentage: 100 / ALL_CODES_LEN };
    }).sort((a, b) => b.percentage - a.percentage);
    return { hotList, decayFactorUsed: decayFactor };
  }

  // compute initial weight for recency = N-1: w0 = exp(-decayFactor * (N-1))
  const factor = Math.exp(decayFactor); // multiplier to move recency down by 1
  let weight = Math.exp(-decayFactor * (N - 1));
  let totalWeight = 0;

  for (let i = 0; i < N; i++) {
    const code = sequence[i];
    if (scores[code] !== undefined) {
      scores[code] += weight;
    }
    totalWeight += weight;
    weight *= factor; // next iteration weight is previous * e^(decayFactor)
  }

  const hotList = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const weightScore = scores[code] || 0;
    const percentage = (weightScore / totalWeight) * 100;
    return { code, name: meta?.name || "Desconocido", emoji: meta?.emoji || "🎲", weightScore, percentage };
  }).sort((a, b) => b.percentage - a.percentage);

  return { hotList, decayFactorUsed: decayFactor };
}

/**
 * calculatePoissonHourDensity
 * - Semántica preservada; implementación similar pero escrita con bucles for para menor overhead.
 */
export function calculatePoissonHourDensity(
  accumulatedResults: any[],
  loteria: string,
  selectedHour: string,
  currentDate?: string
): PoissonResult {
  const filtered = accumulatedResults.filter(
    (r) => r.loteria === loteria && (!currentDate || r.fecha !== currentDate)
  );
  const D = filtered.length;

  const counts: Record<string, number> = {};
  for (let i = 0; i < ALL_CODES_LEN; i++) counts[ALL_ANIMAL_CODES[i]] = 0;

  for (let i = 0; i < filtered.length; i++) {
    const code = filtered[i].draws?.[selectedHour];
    if (code && counts[code] !== undefined) counts[code]++;
  }

  const densityList = new Array(ALL_CODES_LEN);
  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const code = ALL_ANIMAL_CODES[i];
    const meta = ANIMALITOS[code];
    const count = counts[code] || 0;
    const lambda = D > 0 ? (count + 0.1) / (D + 3.7) : 1 / 37;
    const prob = 1 - Math.exp(-lambda);
    densityList[i] = { code, name: meta?.name || "Desconocido", emoji: meta?.emoji || "🎲", lambda, prob };
  }
  densityList.sort((a, b) => b.prob - a.prob);

  return { criticalHour: selectedHour, densityList };
}

/**
 * runMonteCarloOracle
 * - Optimized sampling: precompute cumulative distribution into a Float64Array and sample with binary search.
 * - Use TypedArray (Uint32Array) to store hit counters to reduce object allocation and GC.
 */
export function runMonteCarloOracle(
  markov: MarkovResult,
  bayesian: BayesianResult,
  poisson: PoissonResult,
  simulationsRun = 10000
): MonteCarloResult {
  const combinedScores: Float64Array = new Float64Array(ALL_CODES_LEN);
  let totalScore = 0;

  // Index maps for fast lookup
  const markov1Map = new Map(markov.order1.map(x => [x.code, x.prob]));
  const markov2Map = new Map(markov.order2.map(x => [x.code, x.prob]));
  const bayesMap = new Map(bayesian.hotList.map(x => [x.code, x.percentage / 100]));
  const poissonMap = new Map(poisson.densityList.map(x => [x.code, x.prob]));

  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const code = ALL_ANIMAL_CODES[i];
    const m1 = markov1Map.get(code) || (1 / ALL_CODES_LEN);
    const m2 = markov2Map.get(code) || (1 / ALL_CODES_LEN);
    const b = bayesMap.get(code) || (1 / ALL_CODES_LEN);
    const p = poissonMap.get(code) || (1 / ALL_CODES_LEN);

    const markovWeight = markov.activeOrder2Seed ? m1 : (0.4 * m2 + 0.6 * m1);
    const score = 0.40 * markovWeight + 0.30 * b + 0.30 * p;
    combinedScores[i] = score;
    totalScore += score;
  }

  // Build cumulative distribution (Float64Array)
  const cumulative = new Float64Array(ALL_CODES_LEN);
  let acc = 0;
  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const prob = totalScore > 0 ? combinedScores[i] / totalScore : 1 / ALL_CODES_LEN;
    acc += prob;
    cumulative[i] = acc;
  }
  // Guard last value to be exactly 1 to avoid float issues
  cumulative[ALL_CODES_LEN - 1] = 1;

  // Map index by code for final mapping
  const codeToIndex = new Map<string, number>();
  for (let i = 0; i < ALL_CODES_LEN; i++) codeToIndex.set(ALL_ANIMAL_CODES[i], i);

  // TypedArray hits
  const hits = new Uint32Array(ALL_CODES_LEN);

  // Binary search helper
  function findIndexByRandom(r: number): number {
    let lo = 0, hi = ALL_CODES_LEN - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (r <= cumulative[mid]) hi = mid;
      else lo = mid + 1;
    }
    return lo;
  }

  // Run simulations
  for (let s = 0; s < simulationsRun; s++) {
    const r = Math.random();
    const idx = findIndexByRandom(r);
    hits[idx] = (hits[idx] || 0) + 1;
  }

  // Build probability cloud
  const probabilityCloud = new Array(ALL_CODES_LEN);
  for (let i = 0; i < ALL_CODES_LEN; i++) {
    const code = ALL_ANIMAL_CODES[i];
    const meta = ANIMALITOS[code];
    const hitCount = hits[i];
    const percentage = (hitCount / simulationsRun) * 100;
    probabilityCloud[i] = { code, name: meta?.name || "Desconocido", emoji: meta?.emoji || "🎲", hits: hitCount, percentage };
  }
  probabilityCloud.sort((a, b) => b.percentage - a.percentage);

  return { simulationsRun, probabilityCloud };
}

/* Simple cache for oracle results with bounded size to avoid memory blowup */
const oracleCache = new Map<string, ComprehensiveOracleResult>();
const CACHE_SIZE_LIMIT = 300; // configurable upper limit

function ensureCacheLimit() {
  if (oracleCache.size <= CACHE_SIZE_LIMIT) return;
  // remove oldest half (simple approach)
  const removeCount = Math.ceil(oracleCache.size / 2);
  const keys = oracleCache.keys();
  for (let i = 0; i < removeCount; i++) {
    const k = keys.next().value;
    if (k) oracleCache.delete(k);
  }
}

/* small djb2-style hash to shorten history */
function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h & 0xffffffff;
  }
  // to positive base36 short
  return (h >>> 0).toString(36);
}

/**
 * getOracleCacheKey
 * - Reduce key size by limiting history to last N relevant entries and hashing them.
 */
export function getOracleCacheKey(
  accumulatedResults: any[],
  currentDraws: Record<string, string | null>,
  loteria: string,
  selectedHour: string,
  isNextDayFirstHour: boolean,
  currentDate?: string
): string {
  const HISTORY_LIMIT = 60; // latest N records to include in key
  const relevant = accumulatedResults
    .filter((r) => r.loteria === loteria)
    .slice(-HISTORY_LIMIT) // only last N
    .map((r) => `${r.fecha}:${Object.entries(r.draws || {}).map(([k, v]) => `${k}=${v}`).join("|")}`)
    .join(";");

  const drawsSerialized = Object.entries(currentDraws || {})
    .sort()
    .map(([k, v]) => `${k}:${v || "null"}`)
    .join(",");

  const compactHistoryHash = shortHash(relevant);
  const compactDrawsHash = shortHash(drawsSerialized);

  return `${loteria}_${selectedHour}_${isNextDayFirstHour}_${currentDate || "no_date"}_h${compactHistoryHash}_d${compactDrawsHash}`;
}

/**
 * clearOracleCache
 */
export function clearOracleCache(): void {
  oracleCache.clear();
  // Keep the console log for operator visibility
  console.log("🔮 [Oracle Cache] Predicciones limpiadas de memoria.");
}

/**
 * computeComprehensiveOracle
 * - Orchestrator: uses cache key + eviction policy
 */
export function computeComprehensiveOracle(
  accumulatedResults: any[],
  currentDraws: Record<string, string | null>,
  loteria: string,
  selectedHour: string,
  hoursList: string[],
  isNextDayFirstHour = false,
  currentDate?: string
): ComprehensiveOracleResult {
  const cacheKey = getOracleCacheKey(
    accumulatedResults,
    currentDraws,
    loteria,
    selectedHour,
    isNextDayFirstHour,
    currentDate
  );

  if (oracleCache.has(cacheKey)) {
    // cache hit
    // console.debug(`🔮 [Oracle Cache] HIT ${loteria} ${selectedHour}`);
    return oracleCache.get(cacheKey)!;
  }

  // Compute inputs
  const { sequence, lastCode, prevCode } = getSequenceOfDraws(
    accumulatedResults,
    currentDraws,
    loteria,
    selectedHour,
    hoursList,
    isNextDayFirstHour,
    currentDate
  );

  const markov = calculateMarkovTransitions(sequence, lastCode, prevCode);
  const bayesian = calculateBayesianWeights(sequence, 0.05);
  const poisson = calculatePoissonHourDensity(
    accumulatedResults,
    loteria,
    isNextDayFirstHour ? hoursList[0] : selectedHour,
    currentDate
  );

  // MonteCarlo simulations can be tuned; default kept at 10000 to preserve behavior but can be reduced for lower latency
  const monteCarlo = runMonteCarloOracle(markov, bayesian, poisson, 10000);

  const result: ComprehensiveOracleResult = { markov, bayesian, poisson, monteCarlo };

  // Insert to cache and enforce size limit
  oracleCache.set(cacheKey, result);
  ensureCacheLimit();

  return result;
}

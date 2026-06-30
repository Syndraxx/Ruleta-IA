import { ANIMALITOS } from "../data/animalitos";

// All canonical animal codes
export const ALL_ANIMAL_CODES = Object.keys(ANIMALITOS);

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
 * Parses all history and current draws to build a single chronological sequence of animal codes for this loteria.
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

  // 1. Sort historical records chronologically, filtering out the active day (today) if present in accumulatedResults
  const filtered = accumulatedResults
    .filter((r) => r.loteria === loteria && (!currentDate || r.fecha !== currentDate))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  // 2. Append draws in daily hourly order
  filtered.forEach((record) => {
    hoursList.forEach((h) => {
      const code = record.draws?.[h];
      if (code) {
        sequence.push(code);
      }
    });
  });

  // 3. Append today's draws
  if (isNextDayFirstHour) {
    hoursList.forEach((h) => {
      const code = currentDraws[h];
      if (code) {
        sequence.push(code);
      }
    });
  } else {
    // Append today's draws before the selected hour
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
      // Look back at yesterday's draws!
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

/**
 * Calculates Markov Chain Transitions (Order 1 and Order 2)
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

  // Initialize count maps
  ALL_ANIMAL_CODES.forEach((c) => {
    order1Counts[c] = 0;
    order2Counts[c] = 0;
  });

  // Calculate Order 1 transition: lastCode -> next
  if (lastCode) {
    for (let i = 0; i < sequence.length - 1; i++) {
      if (sequence[i] === lastCode) {
        const next = sequence[i + 1];
        if (order1Counts[next] !== undefined) {
          order1Counts[next]++;
          totalOrder1++;
        }
      }
    }
  }

  // Calculate Order 2 transition: (prevCode, lastCode) -> next
  if (prevCode && lastCode) {
    for (let i = 0; i < sequence.length - 2; i++) {
      if (sequence[i] === prevCode && sequence[i + 1] === lastCode) {
        const next = sequence[i + 2];
        if (order2Counts[next] !== undefined) {
          order2Counts[next]++;
          totalOrder2++;
        }
      }
    }
  }

  let activeOrder1Seed = false;
  let activeOrder2Seed = false;

  // Backing off or seeding if history is scarce
  if (totalOrder1 < 3 && lastCode) {
    activeOrder1Seed = true;
    // Seed with companion standard trilogies + some random
    const baseVal = lastCode === "00" ? 37 : parseInt(lastCode, 10);
    for (let offset of [11, 22, 33]) {
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
    // Seed using order 1 counts or standard combinations
    ALL_ANIMAL_CODES.forEach((c) => {
      order2Counts[c] = order1Counts[c] || 1;
      totalOrder2 += order2Counts[c];
    });
  }

  // Convert to sorted lists
  const order1 = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const count = order1Counts[code] || 0;
    const prob = totalOrder1 > 0 ? count / totalOrder1 : 1 / ALL_ANIMAL_CODES.length;
    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      count,
      prob,
    };
  }).sort((a, b) => b.prob - a.prob);

  const order2 = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const count = order2Counts[code] || 0;
    const prob = totalOrder2 > 0 ? count / totalOrder2 : 1 / ALL_ANIMAL_CODES.length;
    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      count,
      prob,
    };
  }).sort((a, b) => b.prob - a.prob);

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
 * Calculates Bayesian Weighting with Recency Exponential Decay
 */
export function calculateBayesianWeights(
  sequence: string[],
  decayFactor = 0.04
): BayesianResult {
  const scores: Record<string, number> = {};
  ALL_ANIMAL_CODES.forEach((c) => {
    scores[c] = 0;
  });

  const N = sequence.length;
  let totalWeight = 0;

  // Sum weights: e^(-decayFactor * recency)
  for (let i = 0; i < N; i++) {
    const code = sequence[i];
    const recency = N - 1 - i;
    const weight = Math.exp(-decayFactor * recency);
    if (scores[code] !== undefined) {
      scores[code] += weight;
    }
    totalWeight += weight;
  }

  // If sequence is completely empty, use uniform seeds
  if (totalWeight === 0) {
    ALL_ANIMAL_CODES.forEach((c) => {
      scores[c] = 1;
      totalWeight += 1;
    });
  }

  const hotList = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const weightScore = scores[code] || 0;
    const percentage = (weightScore / totalWeight) * 100;
    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      weightScore,
      percentage,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  return {
    hotList,
    decayFactorUsed: decayFactor,
  };
}

/**
 * Calculates Poisson critical density per hour slot
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
  ALL_ANIMAL_CODES.forEach((c) => {
    counts[c] = 0;
  });

  filtered.forEach((record) => {
    const code = record.draws?.[selectedHour];
    if (code && counts[code] !== undefined) {
      counts[code]++;
    }
  });

  // Calculate lambda and Poisson probability of >= 1 occurrences
  const densityList = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const count = counts[code] || 0;
    // Lambda (average appearances per single daily trial for this specific slot)
    // Add a small Laplace smoothing prior so we never get exactly 0
    const lambda = D > 0 ? (count + 0.1) / (D + 3.7) : 1 / 37;
    // P(k >= 1; lambda) = 1 - e^-lambda
    const prob = 1 - Math.exp(-lambda);

    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      lambda,
      prob,
    };
  }).sort((a, b) => b.prob - a.prob);

  return {
    criticalHour: selectedHour,
    densityList,
  };
}

/**
 * Runs 10,000 Monte Carlo simulations to generate a "Future Probability Cloud"
 */
export function runMonteCarloOracle(
  markov: MarkovResult,
  bayesian: BayesianResult,
  poisson: PoissonResult,
  simulationsRun = 10000
): MonteCarloResult {
  const combinedScores: Record<string, number> = {};
  let totalScore = 0;

  // Index maps for fast lookup
  const markov1Map = new Map(markov.order1.map(x => [x.code, x.prob]));
  const markov2Map = new Map(markov.order2.map(x => [x.code, x.prob]));
  const bayesMap = new Map(bayesian.hotList.map(x => [x.code, x.percentage / 100]));
  const poissonMap = new Map(poisson.densityList.map(x => [x.code, x.prob]));

  ALL_ANIMAL_CODES.forEach((code) => {
    const m1 = markov1Map.get(code) || (1 / 37);
    const m2 = markov2Map.get(code) || (1 / 37);
    const b = bayesMap.get(code) || (1 / 37);
    const p = poissonMap.get(code) || (1 / 37);

    // Dynamic weight crossing: 
    // If order 2 is fully active/seeded (low actual order 2 pairs found), put more weight on order 1
    const markovWeight = markov.activeOrder2Seed ? m1 : (0.4 * m2 + 0.6 * m1);
    
    // Balanced prediction crossing: 40% Markov, 30% Bayesian (recent streak), 30% Poisson (hour specificity)
    const score = 0.40 * markovWeight + 0.30 * b + 0.30 * p;
    combinedScores[code] = score;
    totalScore += score;
  });

  // Normalize scores into cumulative distribution array
  const cumulativeDistribution: Array<{ code: string; upper: number }> = [];
  let currentSum = 0;
  ALL_ANIMAL_CODES.forEach((code) => {
    const prob = totalScore > 0 ? combinedScores[code] / totalScore : 1 / 37;
    currentSum += prob;
    cumulativeDistribution.push({ code, upper: currentSum });
  });

  // Prepare hit counter
  const hits: Record<string, number> = {};
  ALL_ANIMAL_CODES.forEach((c) => {
    hits[c] = 0;
  });

  // Run 10k simulations
  for (let s = 0; s < simulationsRun; s++) {
    const r = Math.random();
    // Binary search or direct search through cumulative distribution
    let selectedCode = ALL_ANIMAL_CODES[0];
    for (let idx = 0; idx < cumulativeDistribution.length; idx++) {
      if (r <= cumulativeDistribution[idx].upper) {
        selectedCode = cumulativeDistribution[idx].code;
        break;
      }
    }
    hits[selectedCode]++;
  }

  // Map into final probability cloud
  const probabilityCloud = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const hitCount = hits[code] || 0;
    const percentage = (hitCount / simulationsRun) * 100;
    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      hits: hitCount,
      percentage,
    };
  }).sort((a, b) => b.percentage - a.percentage);

  return {
    simulationsRun,
    probabilityCloud,
  };
}

/**
 * Single master function that returns all results cleanly
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
  const monteCarlo = runMonteCarloOracle(markov, bayesian, poisson, 10000);

  return {
    markov,
    bayesian,
    poisson,
    monteCarlo,
  };
}

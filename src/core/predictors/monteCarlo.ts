import { ANIMALITOS } from "../../data/animalitos";
import { MarkovResult, BayesianResult, PoissonResult, MonteCarloResult } from "../schemas/types";

const ALL_ANIMAL_CODES = Object.keys(ANIMALITOS);

/**
 * Ejecuta simulaciones de Monte Carlo basadas en perfiles de calibración dinámica
 */
export function runMonteCarloOracle(
  markov: MarkovResult,
  bayesian: BayesianResult,
  poisson: PoissonResult,
  simulationsRun = 10000,
  calibrationProfile = "equilibrado",
  appearedToday: string[] = []
): MonteCarloResult {
  const combinedScores: Record<string, number> = {};
  let totalScore = 0;

  // Mapas de indexación rápida
  const markov1Map = new Map(markov.order1.map(x => [x.code, x.prob]));
  const markov2Map = new Map(markov.order2.map(x => [x.code, x.prob]));
  const bayesMap = new Map(bayesian.hotList.map(x => [x.code, x.percentage / 100]));
  const poissonMap = new Map(poisson.densityList.map(x => [x.code, x.prob]));

  // Definir multiplicadores basados en el perfil de calibración seleccionado
  let markovWeightFactor = 0.40;
  let bayesianWeightFactor = 0.30;
  let poissonWeightFactor = 0.30;

  if (calibrationProfile === "rotacion") {
    markovWeightFactor = 0.15;
    bayesianWeightFactor = 0.40;
    poissonWeightFactor = 0.45;
  } else if (calibrationProfile === "repeticion") {
    markovWeightFactor = 0.60;
    bayesianWeightFactor = 0.30;
    poissonWeightFactor = 0.10;
  } else if (calibrationProfile === "racha") {
    markovWeightFactor = 0.45;
    bayesianWeightFactor = 0.45;
    poissonWeightFactor = 0.10;
  }

  ALL_ANIMAL_CODES.forEach((code) => {
    const m1 = markov1Map.get(code) || (1 / 37);
    const m2 = markov2Map.get(code) || (1 / 37);
    const b = bayesMap.get(code) || (1 / 37);
    const p = poissonMap.get(code) || (1 / 37);

    // Si orden 2 está sembrado (pocos datos reales de orden 2), dar más peso a orden 1
    const markovWeight = markov.activeOrder2Seed ? m1 : (0.4 * m2 + 0.6 * m1);

    // Cálculo central con coeficientes del perfil
    let score = markovWeightFactor * markovWeight + bayesianWeightFactor * b + poissonWeightFactor * p;

    // Aplicar lógica especial para animales que ya salieron hoy
    const wasDrawnToday = appearedToday.includes(code);
    if (wasDrawnToday) {
      if (calibrationProfile === "rotacion") {
        score = score * 0.05; // Penalización severa
      } else if (calibrationProfile === "repeticion") {
        score = score * 1.75; // Impulso para repetición temporal inmediata
      }
    } else {
      if (calibrationProfile === "rotacion") {
        score = score * 1.25; // Recompensa leve por frío
      }
    }

    combinedScores[code] = score;
    totalScore += score;
  });

  // Normalizar puntajes en una distribución acumulativa para búsqueda binaria
  const cumulativeDistribution: Array<{ code: string; upper: number }> = [];
  let currentSum = 0;
  ALL_ANIMAL_CODES.forEach((code) => {
    const prob = totalScore > 0 ? combinedScores[code] / totalScore : 1 / 37;
    currentSum += prob;
    cumulativeDistribution.push({ code, upper: currentSum });
  });

  // Contador de aciertos
  const hits: Record<string, number> = {};
  ALL_ANIMAL_CODES.forEach((c) => {
    hits[c] = 0;
  });

  // Ejecución de las simulaciones usando búsqueda binaria de alta velocidad
  for (let s = 0; s < simulationsRun; s++) {
    const r = Math.random();
    let low = 0;
    let high = cumulativeDistribution.length - 1;
    let selectedCode = ALL_ANIMAL_CODES[0];

    while (low <= high) {
      const mid = (low + high) >> 1;
      if (r <= cumulativeDistribution[mid].upper) {
        selectedCode = cumulativeDistribution[mid].code;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
    hits[selectedCode]++;
  }

  // Mapear a la nube de probabilidad final
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

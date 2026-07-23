import { ANIMALITOS } from "../../data/animalitos";
import { BayesianResult } from "../schemas/types";

const ALL_ANIMAL_CODES = Object.keys(ANIMALITOS);

/**
 * Calcula las ponderaciones Bayesianas con decaimiento exponencial según recencia
 */
export function calculateBayesianWeights(
  sequence: string[],
  decayFactor = 0.05
): BayesianResult {
  const scores: Record<string, number> = {};
  ALL_ANIMAL_CODES.forEach((c) => {
    scores[c] = 0;
  });

  const N = sequence.length;
  let totalWeight = 0;

  // Sumar pesos: e^(-decayFactor * recencia)
  for (let i = 0; i < N; i++) {
    const code = sequence[i];
    const recency = N - 1 - i;
    const weight = Math.exp(-decayFactor * recency);
    if (scores[code] !== undefined) {
      scores[code] += weight;
    }
    totalWeight += weight;
  }

  // Si la secuencia está vacía, usar distribución uniforme
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

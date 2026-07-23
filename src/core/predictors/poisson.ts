import { ANIMALITOS } from "../../data/animalitos";
import { PoissonResult } from "../schemas/types";

const ALL_ANIMAL_CODES = Object.keys(ANIMALITOS);

/**
 * Calcula la densidad de probabilidad de Poisson por franja horaria
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

  // Calcular lambda y la probabilidad de Poisson de >= 1 ocurrencia
  const densityList = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const count = counts[code] || 0;
    // Lambda (promedio de apariciones por sorteo diario para esta franja específica)
    // Agregamos un pequeño suavizado de Laplace para evitar extremos de 0
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

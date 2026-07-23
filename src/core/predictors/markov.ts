import { ANIMALITOS } from "../../data/animalitos";
import { MarkovResult } from "../schemas/types";

const ALL_ANIMAL_CODES = Object.keys(ANIMALITOS);

/**
 * Calcula las transiciones de la cadena de Markov (Orden 1 y Orden 2 Completo con Suavizado Aditivo)
 * 
 * Filosofía de Ingeniería:
 * Para evitar que las secuencias de baja frecuencia (común en sorteos de lotería diarios como Lotto Activo)
 * produzcan probabilidades de 0 (el problema del "Zero-Probability" en cadenas de Markov de alto orden),
 * implementamos un modelo de transición con Suavizado de Lidstone (Laplace generalizado)
 * y un algoritmo de retroceso (Backoff) dinámico que se activa cuando la semilla de dos estados
 * es escasa o inexistente en el historial.
 */
export function calculateMarkovTransitions(
  sequence: string[],
  lastCode: string | null,
  prevCode: string | null
): MarkovResult {
  // Matriz de transición Orden 1: t1[actual][siguiente] = count
  const t1: Record<string, Record<string, number>> = {};
  // Matriz de transición Orden 2: t2[`${prev}-${curr}`][siguiente] = count
  const t2: Record<string, Record<string, number>> = {};

  // Inicializar matrices de transición para todos los códigos posibles para garantizar consistencia
  ALL_ANIMAL_CODES.forEach((code) => {
    t1[code] = {};
    ALL_ANIMAL_CODES.forEach((nextCode) => {
      t1[code][nextCode] = 0;
    });
  });

  // 1. Construir matriz de transición de Orden 1
  for (let i = 0; i < sequence.length - 1; i++) {
    const current = sequence[i];
    const next = sequence[i + 1];
    if (t1[current] && t1[current][next] !== undefined) {
      t1[current][next]++;
    }
  }

  // 2. Construir matriz de transición de Orden 2 REAL
  for (let i = 0; i < sequence.length - 2; i++) {
    const prev = sequence[i];
    const curr = sequence[i + 1];
    const next = sequence[i + 2];
    const pairKey = `${prev}-${curr}`;

    if (!t2[pairKey]) {
      t2[pairKey] = {};
      ALL_ANIMAL_CODES.forEach((code) => {
        t2[pairKey][code] = 0;
      });
    }
    if (t2[pairKey][next] !== undefined) {
      t2[pairKey][next]++;
    }
  }

  // Estados de sembrado / backoff
  let activeOrder1Seed = false;
  let activeOrder2Seed = false;

  // 3. Extraer conteos y calcular probabilidades condicionales para Orden 1 (lastCode -> next)
  const order1Counts: Record<string, number> = {};
  let totalOrder1 = 0;

  if (lastCode && t1[lastCode]) {
    ALL_ANIMAL_CODES.forEach((code) => {
      order1Counts[code] = t1[lastCode][code] || 0;
      totalOrder1 += order1Counts[code];
    });
  }

  // Backoff / Sembrado si Orden 1 tiene datos muy escasos
  if (totalOrder1 < 3 && lastCode) {
    activeOrder1Seed = true;
    // Semilla tradicional basada en relaciones armónicas y distancia numérica de la lotería venezolana
    const baseVal = lastCode === "00" ? 37 : parseInt(lastCode, 10);
    const harmonicOffsets = [11, 22, 33]; // Desplazamientos típicos en la ruleta de animalitos
    
    harmonicOffsets.forEach((offset) => {
      const codeStr = ((baseVal + offset) % 38).toString().padStart(2, "0");
      const normalizedCode = codeStr === "37" ? "00" : codeStr;
      if (order1Counts[normalizedCode] !== undefined) {
        order1Counts[normalizedCode] += 3;
        totalOrder1 += 3;
      }
    });

    // Añadir suavizado de Lidstone (alpha = 0.5) para que no haya probabilidades puras de cero
    ALL_ANIMAL_CODES.forEach((code) => {
      order1Counts[code] += 0.5;
      totalOrder1 += 0.5;
    });
  }

  // 4. Extraer conteos y calcular probabilidades condicionales para Orden 2 ((prevCode, lastCode) -> next)
  const order2Counts: Record<string, number> = {};
  let totalOrder2 = 0;
  const seedKey = prevCode && lastCode ? `${prevCode}-${lastCode}` : null;

  if (seedKey && t2[seedKey]) {
    ALL_ANIMAL_CODES.forEach((code) => {
      order2Counts[code] = t2[seedKey][code] || 0;
      totalOrder2 += order2Counts[code];
    });
  }

  // Backoff / Fallback de Orden 2 hacia Orden 1 si no hay datos o la muestra es insignificante (< 2 transiciones)
  if (totalOrder2 < 2 && lastCode) {
    activeOrder2Seed = true;
    // Retroceso dinámico a la distribución de Orden 1 con un factor de suavizado aditivo
    ALL_ANIMAL_CODES.forEach((code) => {
      // Usamos el conteo de Orden 1 como prior bayesiano para Orden 2
      const priorCount = order1Counts[code] || 0;
      order2Counts[code] = priorCount + 0.1; // Suavizado de Lidstone
      totalOrder2 += order2Counts[code];
    });
  }

  // 5. Mapear y ordenar los resultados de Primer Orden (Marginales)
  const order1 = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const count = order1Counts[code] || 0;
    const prob = totalOrder1 > 0 ? count / totalOrder1 : 1 / ALL_ANIMAL_CODES.length;
    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      count: Math.round(count), // Redondear para la visualización del usuario si contiene floats por suavizado
      prob,
    };
  }).sort((a, b) => b.prob - a.prob);

  // 6. Mapear y ordenar los resultados de Segundo Orden (Condicionales reales)
  const order2 = ALL_ANIMAL_CODES.map((code) => {
    const meta = ANIMALITOS[code];
    const count = order2Counts[code] || 0;
    const prob = totalOrder2 > 0 ? count / totalOrder2 : 1 / ALL_ANIMAL_CODES.length;
    return {
      code,
      name: meta?.name || "Desconocido",
      emoji: meta?.emoji || "🎲",
      count: Math.round(count),
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

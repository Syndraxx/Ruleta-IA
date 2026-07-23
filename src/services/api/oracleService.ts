import { ComprehensiveOracleResult } from "../../core/schemas/types";
import { ANIMALITOS, FAMILIAS } from "../../data/animalitos";

export interface PredictionParams {
  accumulatedResults: any[];
  currentDraws: Record<string, string | null>;
  loteria: string;
  selectedHour: string;
  hoursList: string[];
  isNextDayFirstHour: boolean;
  currentDate: string;
  simulationsRun?: number;
  calibrationProfile?: string;
}

export interface PatternDetail {
  id: string;
  triggerCategory: string;
  targetCategory: string;
  hourParity: "PAR" | "IMPAR";
  description: string;
  probability: number;
  occurrences: number;
  totalTransitions: number;
  confidenceLabel: "ALTA" | "MEDIA";
  recommendedAnimals: string[];
}

export class OracleService {
  /**
   * Analiza la secuencia histórica de los últimos 30 días para identificar formas de juego recurrentes.
   * Filtra transiciones biológicas específicas (Terrestres, Acuáticos, Plumas, Rastreros) bajo la paridad horaria.
   */
  static fetchPatternSync(accumulatedResults: any[], loteria: string): {
    success: boolean;
    patterns: PatternDetail[];
    gameStyleLabel: string;
    gameStyleDescription: string;
    metrics: {
      totalAnalyzed: number;
      dominantCategory: string;
      evenHourRatio: number;
    };
  } {
    // 1. Filtrar y ordenar los días históricos por fecha de forma ascendente
    const sortedDays = [...accumulatedResults]
      .filter((r) => r.loteria === loteria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-30); // Últimos 30 días

    // Helpers locales para clasificar y parsear
    const getMinutesFromMidnight = (hourStr: string): number => {
      const clean = hourStr.toUpperCase().trim();
      const match = clean.match(/^(\d+):(\d+)/);
      if (!match) return 0;
      let hourNum = parseInt(match[1], 10);
      const minNum = parseInt(match[2], 10);
      if (clean.includes("PM") && hourNum < 12) hourNum += 12;
      else if (clean.includes("AM") && hourNum === 12) hourNum = 0;
      return hourNum * 60 + minNum;
    };

    const isEvenHour = (hourStr: string): boolean => {
      const clean = hourStr.toUpperCase().trim();
      const match = clean.match(/^(\d+)/);
      if (!match) return false;
      let hourNum = parseInt(match[1], 10);
      if (clean.includes("PM") && hourNum < 12) {
        hourNum += 12;
      } else if (clean.includes("AM") && hourNum === 12) {
        hourNum = 0;
      }
      return hourNum % 2 === 0;
    };

    const getAnimalCategory = (code: string): string => {
      const norm = code === "00" || code === "0" 
        ? code 
        : (code.startsWith("0") ? code.substring(1) : code);

      const acuaticos = ["00", "0", "6", "30", "33"];
      const felinos_salvajes = ["5", "10", "15", "16", "29"];
      const plumas = ["7", "9", "14", "17", "21", "25", "28"];
      const corredores = ["1", "2", "12", "18", "19", "22", "23", "26", "34", "35"];
      
      if (acuaticos.includes(norm)) return "acuatico";
      if (plumas.includes(norm)) return "pluma";
      if (felinos_salvajes.includes(norm) || corredores.includes(norm)) return "terrestre";
      return "rastrero";
    };

    const categoryNames: Record<string, string> = {
      terrestre: "Terrestre",
      acuatico: "Acuático",
      pluma: "Pluma (Aves)",
      rastrero: "Rastrero / Pequeño"
    };

    const categoryEmojis: Record<string, string> = {
      terrestre: "🦁",
      acuatico: "🐋",
      pluma: "🦅",
      rastrero: "🦂"
    };

    // 2. Construir la secuencia cronológica de sorteos
    const drawsSequence: Array<{ code: string; hour: string; date: string; category: string }> = [];
    let countEvenHours = 0;

    sortedDays.forEach((day) => {
      const sortedHours = Object.keys(day.draws || {}).sort((a, b) => {
        return getMinutesFromMidnight(a) - getMinutesFromMidnight(b);
      });
      
      sortedHours.forEach((hour) => {
        const code = day.draws[hour];
        if (code) {
          const cat = getAnimalCategory(code);
          drawsSequence.push({
            code,
            hour,
            date: day.fecha,
            category: cat
          });
          if (isEvenHour(hour)) {
            countEvenHours++;
          }
        }
      });
    });

    if (drawsSequence.length < 5) {
      return {
        success: false,
        patterns: [],
        gameStyleLabel: "Baja Densidad de Datos",
        gameStyleDescription: "Se requieren al menos 5 sorteos cargados en el historial para mapear el comportamiento cíclico de la ruleta.",
        metrics: { totalAnalyzed: drawsSequence.length, dominantCategory: "Ninguna", evenHourRatio: 0 }
      };
    }

    // 3. Analizar transiciones consecutivas en la secuencia
    const transitionCounts: Record<string, number> = {};
    const totalTransitionsForTrigger: Record<string, number> = {};

    for (let i = 0; i < drawsSequence.length - 1; i++) {
      const curr = drawsSequence[i];
      const next = drawsSequence[i + 1];
      
      const hourParity = isEvenHour(next.hour) ? "PAR" : "IMPAR";
      const key = `${curr.category}->${next.category}@${hourParity}`;
      const baseKey = `${curr.category}@${hourParity}`;

      transitionCounts[key] = (transitionCounts[key] || 0) + 1;
      totalTransitionsForTrigger[baseKey] = (totalTransitionsForTrigger[baseKey] || 0) + 1;
    }

    // 4. Agrupar y calificar los patrones con mayor confluencia
    const detectedPatterns: PatternDetail[] = [];

    Object.entries(transitionCounts).forEach(([key, count]) => {
      const [transition, hourParity] = key.split("@") as [string, "PAR" | "IMPAR"];
      const [triggerCat, targetCat] = transition.split("->");
      const baseKey = `${triggerCat}@${hourParity}`;
      const total = totalTransitionsForTrigger[baseKey] || 1;
      const prob = (count / total) * 100;

      // Filtros Staff Engineer para evitar falsos positivos:
      // - Al menos 3 ocurrencias registradas en el histórico de 30 días.
      // - Probabilidad de confluencia mayor al 35%.
      if (count >= 3 && prob >= 35) {
        // Seleccionar recomendaciones inteligentes para esta categoría de destino
        let recommended: string[] = [];
        if (targetCat === "acuatico") {
          recommended = ["30", "0", "00"]; // Caimán, Delfín, Ballena
        } else if (targetCat === "terrestre") {
          recommended = ["5", "12", "10"]; // León, Caballo, Tigre
        } else if (targetCat === "pluma") {
          recommended = ["9", "28", "14"]; // Águila, Zamuro, Paloma
        } else {
          recommended = ["36", "4", "8"]; // Culebra, Alacrán, Ratón
        }

        const trigEmoji = categoryEmojis[triggerCat] || "🐾";
        const tarEmoji = categoryEmojis[targetCat] || "🐾";
        const trigName = categoryNames[triggerCat] || triggerCat;
        const tarName = categoryNames[targetCat] || targetCat;

        detectedPatterns.push({
          id: `${triggerCat}_to_${targetCat}_at_${hourParity}`,
          triggerCategory: triggerCat,
          targetCategory: targetCat,
          hourParity,
          occurrences: count,
          totalTransitions: total,
          probability: prob,
          confidenceLabel: prob >= 65 ? "ALTA" : "MEDIA",
          description: `Patrón Biológico Cíclico: Al salir un animal **${trigName}** ${trigEmoji}, la ruleta tiende a girar hacia un **${tarName}** ${tarEmoji} en las siguientes horas **${hourParity.toLowerCase()}es** con un nivel de repetición del ${prob.toFixed(1)}%.`,
          recommendedAnimals: recommended
        });
      }
    });

    // Ordenar patrones por probabilidad descendente
    detectedPatterns.sort((a, b) => b.probability - a.probability);

    // Calcular estadísticas globales
    const categoryFreqs: Record<string, number> = {};
    drawsSequence.forEach(d => {
      categoryFreqs[d.category] = (categoryFreqs[d.category] || 0) + 1;
    });

    const dominantCategory = Object.entries(categoryFreqs)
      .reduce((a, b) => (a[1] > b[1] ? a : b), ["Ninguna", 0])[0];

    const evenHourRatio = (countEvenHours / drawsSequence.length) * 100;

    // Determinar la etiqueta de "Forma de Juego" preponderante en la ruleta
    let gameStyleLabel = "Flujo Equilibrado de Azar";
    let gameStyleDescription = "La distribución de salidas físicas y categorías biológicas se mantiene dentro de los desvíos estándar normales de la teoría de probabilidad.";

    if (detectedPatterns.length > 0) {
      const topPattern = detectedPatterns[0];
      const trigName = categoryNames[topPattern.triggerCategory] || topPattern.triggerCategory;
      const tarName = categoryNames[topPattern.targetCategory] || topPattern.targetCategory;
      
      gameStyleLabel = `Atracción Cíclica ${trigName}-${tarName}`;
      gameStyleDescription = `Se detecta una inercia de arrastre dominante donde la secuencia biológica tiende a oscilar entre grupos de tipo ${trigName} y ${tarName}, acentuada principalmente durante horas ${topPattern.hourParity.toLowerCase()}es.`;
    } else if (evenHourRatio > 60) {
      gameStyleLabel = "Sesgo Horario Par";
      gameStyleDescription = "La ruleta presenta una inercia inusualmente fuerte a liberar aciertos directos en bloques de horas pares (01:00 PM, 03:00 PM, etc.).";
    }

    return {
      success: true,
      patterns: detectedPatterns,
      gameStyleLabel,
      gameStyleDescription,
      metrics: {
        totalAnalyzed: drawsSequence.length,
        dominantCategory: categoryNames[dominantCategory] || dominantCategory,
        evenHourRatio
      }
    };
  }

  /**
   * Consume la API del Oráculo para cálculos probabilísticos y Monte Carlo en el Servidor
   */
  static async fetchPrediction(params: PredictionParams): Promise<ComprehensiveOracleResult> {
    const res = await fetch("/api/predict", {
      method: "POST",
      body: JSON.stringify(params),
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      throw new Error("Error obteniendo la predicción matemática del Oráculo.");
    }

    const json = await res.json();
    if (!json.success || !json.result) {
      throw new Error(json.error || "La respuesta del Oráculo no contiene datos válidos.");
    }

    return json.result;
  }

  /**
   * Consume la API de Deep Learning para obtener anomalías, puntuación de confianza y predicciones LSTM
   */
  static async fetchDeepLearning(sequence: string[]): Promise<{
    anomaly_detected: boolean;
    confidence_score: number;
    next_likely_codes: string[];
  }> {
    const res = await fetch("/api/ml-model", {
      method: "POST",
      body: JSON.stringify({ sequence }),
      headers: { "Content-Type": "application/json" }
    });

    if (!res.ok) {
      throw new Error("Error de comunicación con el motor de Deep Learning LSTM.");
    }

    return res.json();
  }
}

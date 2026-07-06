import { describe, it, expect } from "vitest";
import { computeComprehensiveOracle } from "../utils/predictionEngine";

describe("Motor de Predicción - Pruebas Unitarias", () => {
  it("debería calcular el Oráculo con resultados históricos vacíos", () => {
    const mockAccumulated: any[] = [];
    const mockCurrentDraws: Record<string, string | null> = {
      "09:00 AM": null,
      "10:00 AM": null,
    };
    const hoursList = ["09:00 AM", "10:00 AM"];

    const oracle = computeComprehensiveOracle(
      mockAccumulated,
      mockCurrentDraws,
      "Loto Activo",
      "09:00 AM",
      hoursList,
      false,
      "2026-07-04"
    );

    expect(oracle).toBeDefined();
    expect(oracle.markov).toBeDefined();
    expect(oracle.markov.order1).toBeInstanceOf(Array);
    expect(oracle.bayesian).toBeDefined();
    expect(oracle.bayesian.hotList).toBeInstanceOf(Array);
    expect(oracle.poisson).toBeDefined();
    expect(oracle.poisson.densityList).toBeInstanceOf(Array);
    expect(oracle.monteCarlo).toBeDefined();
    expect(oracle.monteCarlo.probabilityCloud).toBeInstanceOf(Array);
  });

  it("debería calcular el Oráculo utilizando patrones de datos simulados", () => {
    // Simulamos un historial con sesgo hacia el animalito "10" (Tigre) y "25" (Gallina)
    const mockAccumulated = [
      { fecha: "2026-07-01", loteria: "Loto Activo", draws: { "09:00 AM": "10", "10:00 AM": "25" } },
      { fecha: "2026-07-02", loteria: "Loto Activo", draws: { "09:00 AM": "10", "10:00 AM": "33" } },
      { fecha: "2026-07-03", loteria: "Loto Activo", draws: { "09:00 AM": "10", "10:00 AM": "12" } },
    ];
    
    const mockCurrentDraws = {
      "09:00 AM": "10",
      "10:00 AM": null,
    };
    
    const hoursList = ["09:00 AM", "10:00 AM"];

    const oracle = computeComprehensiveOracle(
      mockAccumulated,
      mockCurrentDraws,
      "Loto Activo",
      "10:00 AM",
      hoursList,
      false,
      "2026-07-04"
    );

    expect(oracle).toBeDefined();
    expect(oracle.markov.order1.length).toBeGreaterThan(0);
    expect(oracle.bayesian.hotList.length).toBeGreaterThan(0);
    expect(oracle.monteCarlo.probabilityCloud.length).toBeGreaterThan(0);
  });
});

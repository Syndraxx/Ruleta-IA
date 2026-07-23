export interface AnimalMetadata {
  name: string;
  emoji: string;
  color: string;
}

export interface AccumulatedResult {
  loteria: string;
  fecha: string;
  scrapedSource: string;
  draws: DrawsRecord;
  scrapedHours?: Record<string, boolean>;
  count: number;
  extractedAt: string;
}

export type DrawsRecord = Record<string, string | null>;

export interface ScrapingResponse {
  id: string;
  source: string;
  count: number;
  data: DrawsRecord;
}

export interface AIResponse {
  success: boolean;
  simulado: boolean;
  trilogia: [string, string, string];
  analisis: string;
  error?: string;
}

export interface EngineAccuracy {
  engine: "Markov" | "Bayes" | "Poisson" | "Monte Carlo";
  accuracy: number;
  hits: number;
  total: number;
}

export interface DailyReport {
  fecha: string;
  loteria: string;
  topAnimals: Array<{
    code: string;
    name: string;
    emoji: string;
    count: number;
  }>;
  engineAccuracies: EngineAccuracy[];
  bestEngine: string;
  gamePattern: "Rotación" | "Repetición" | "Racha" | "Equilibrado";
  patternExplanation: string;
  totalDraws: number;
}


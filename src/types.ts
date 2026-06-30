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

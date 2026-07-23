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

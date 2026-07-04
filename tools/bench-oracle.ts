// tools/bench-oracle.ts
// Simple benchmark runner for computeComprehensiveOracle
// Usage: npx ts-node tools/bench-oracle.ts

import { computeComprehensiveOracle } from "../src/utils/predictionEngine";
import { ANIMALITOS } from "../src/data/animalitos";

function makeRandomRecord(date: string, hoursList: string[]) {
  const draws: Record<string, string | null> = {};
  const keys = Object.keys(ANIMALITOS);
  for (const h of hoursList) {
    const pick = keys[Math.floor(Math.random() * keys.length)];
    draws[h] = Math.random() < 0.8 ? pick : null;
  }
  return { fecha: date, loteria: "default", draws };
}

async function runBench(iterations = 100, simulations = 10000) {
  const hoursList = ["08:00 AM","09:00 AM","10:00 AM","11:00 AM","12:00 PM","01:00 PM","02:00 PM","03:00 PM","04:00 PM","05:00 PM"];
  const accumulated: any[] = [];
  // generate 120 days of history
  for (let d = 0; d < 120; d++) {
    const date = new Date(Date.now() - (120 - d) * 24 * 3600 * 1000).toISOString().split('T')[0];
    accumulated.push(makeRandomRecord(date, hoursList));
  }

  const currentDraws: Record<string, string | null> = {};
  for (const h of hoursList) currentDraws[h] = null;
  // fill some current draws
  currentDraws["08:00 AM"] = Object.keys(ANIMALITOS)[Math.floor(Math.random() * Object.keys(ANIMALITOS).length)];

  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = process.hrtime.bigint();
    computeComprehensiveOracle(accumulated, currentDraws, "default", "08:00 AM", hoursList, false, undefined);
    const t1 = process.hrtime.bigint();
    const ms = Number(t1 - t0) / 1_000_000;
    times.push(ms);
  }

  const sum = times.reduce((a,b) => a+b, 0);
  const avg = sum / times.length;
  const sorted = times.slice().sort((a,b) => a-b);
  const p95 = sorted[Math.floor(times.length * 0.95)];
  console.log(`Benchmark results (iterations=${iterations}, simulations=${simulations}):`);
  console.log(`avg: ${avg.toFixed(2)} ms   p95: ${p95.toFixed(2)} ms`);
}

// Run
runBench().catch(err => {
  console.error(err);
  process.exit(1);
});

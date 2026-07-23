import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  TrendingUp, 
  Trash2, 
  HelpCircle, 
  ArrowRight,
  Database
} from "lucide-react";
import { ANIMALITOS } from "../../data/animalitos";
import { HOURS_LIST } from "../../constants";

interface SistemaXTabProps {
  darkMode: boolean;
  cardTheme: string;
  textMutedTheme: string;
  inputTheme: string;
  draws: Record<string, string>;
  accumulatedResults: any[];
  fecha: string;
  playSound: (soundName: string) => void;
  addLog: (message: string) => void;
  loteria?: "Loto Activo" | "La Granjita" | "Selva Plus";
  onChangeLoteria?: (lot: "Loto Activo" | "La Granjita" | "Selva Plus") => void;
}

export function SistemaXTab({
  darkMode,
  cardTheme,
  textMutedTheme,
  inputTheme,
  draws,
  accumulatedResults,
  fecha,
  playSound,
  addLog,
  loteria = "Loto Activo",
  onChangeLoteria
}: SistemaXTabProps) {
  // --- Estados de Control ---
  const [sistemaxHour, setSistemaxHour] = useState<string>("08:00 AM");
  const [sistemaxAuto, setSistemaxAuto] = useState<boolean>(true);
  const [sistemaxSelectedLoteria, setSistemaxSelectedLoteria] = useState<string>("LOTTO ACTIVO");

  // Sync state with selected loteria from main component
  useEffect(() => {
    const target = loteria === "La Granjita" ? "LA GRANJITA" : loteria === "Selva Plus" ? "SELVA PLUS" : "LOTTO ACTIVO";
    if (sistemaxSelectedLoteria !== target) {
      setSistemaxSelectedLoteria(target);
    }
  }, [loteria]);

  // --- Estados Manuales ---
  const [sistemaxRojo1, setSistemaxRojo1] = useState<string>("07");
  const [sistemaxRojo2, setSistemaxRojo2] = useState<string>("05");
  const [sistemaxPar, setSistemaxPar] = useState<string>("22");
  const [sistemaxSalieronTemprano, setSistemaxSalieronTemprano] = useState<boolean>(false);
  
  const [sistemaxParRojo, setSistemaxParRojo] = useState<string>("30");
  const [sistemaxImparNegro, setSistemaxImparNegro] = useState<string>("31");
  const [sistemaxParRojo2, setSistemaxParRojo2] = useState<string>("32");
  const [sistemaxParRojo3, setSistemaxParRojo3] = useState<string>("36");
  
  const [sistemaxImparNegro2, setSistemaxImparNegro2] = useState<string>("29");
  const [sistemaxParNegro, setSistemaxParNegro] = useState<string>("26");
  const [sistemaxImparRojo1, setSistemaxImparRojo1] = useState<string>("01");
  const [sistemaxImparRojo2, setSistemaxImparRojo2] = useState<string>("25");
  
  const [sistemaxImparNegro3, setSistemaxImparNegro3] = useState<string>("33");
  const [sistemaxImparRojo3, setSistemaxImparRojo3] = useState<string>("09");
  const [sistemaxParVerde, setSistemaxParVerde] = useState<string>("0");
  const [sistemaxImparRojo4, setSistemaxImparRojo4] = useState<string>("27");

  // --- Historial de Cálculos Manuales ---
  const [sistemaxLogs, setSistemaxLogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem(`sistemax_logs_${fecha}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(`sistemax_logs_${fecha}`, JSON.stringify(sistemaxLogs));
    } catch (e) {
      console.error("No se pudieron guardar los logs del sistema X", e);
    }
  }, [sistemaxLogs, fecha]);

  // --- Helpers de Formato y Lógica Matemática ---
  const formatToTwoDigits = (num: number): string => {
    const abs = Math.abs(num);
    return abs < 10 ? `0${abs}` : `${abs}`;
  };

  const getDigitSum = (numStr: string): number => {
    const clean = numStr.replace(/\D/g, "");
    let sum = 0;
    for (let c of clean) {
      sum += parseInt(c, 10) || 0;
    }
    return sum;
  };

  const getDigitDifference = (numStr: string): number => {
    const clean = numStr.replace(/\D/g, "");
    if (clean.length === 0) return 0;
    if (clean.length === 1) return parseInt(clean, 10);
    const d1 = parseInt(clean[0], 10) || 0;
    const d2 = parseInt(clean[1], 10) || 0;
    return Math.abs(d2 - d1);
  };

  const wrapAnimalitoCode = (v: number): string => {
    const r = v % 37;
    const positive = r < 0 ? r + 37 : r;
    return formatToTwoDigits(positive);
  };

  const getFormulaTypeForHour = (hour: string) => {
    switch (hour) {
      case "08:00 AM":
      case "09:00 AM":
        return { type: "formula1", name: "Fórmula de Entrada (8am y 9am)", refHour: "8:00/9:00 AM" };
      case "10:00 AM":
        return { type: "formula2", name: "Fórmula de Continuación (10am)", refHour: "10:00 AM" };
      case "11:00 AM":
        return { type: "formula3", name: "Fórmula de Continuación (11am)", refHour: "11:00 AM" };
      case "12:00 PM":
        return { type: "formula4", name: "Fórmula Fija León (12pm)", refHour: "12:00 PM" };
      case "01:00 PM":
      case "02:00 PM":
        return { type: "formula1", name: "Fórmula de Entrada Bloque Tarde (1pm/2pm)", refHour: "8:00/9:00 AM" };
      case "03:00 PM":
        return { type: "formula2", name: "Fórmula de Continuación Tarde (3pm)", refHour: "10:00 AM" };
      case "04:00 PM":
        return { type: "formula3", name: "Fórmula de Continuación Tarde (4pm)", refHour: "11:00 AM" };
      case "05:00 PM":
        return { type: "formula4", name: "Fórmula Fija León Tarde (5pm)", refHour: "12:00 PM" };
      case "06:00 PM":
      case "07:00 PM":
        return { type: "formula1", name: "Fórmula de Entrada Bloque Noche (6pm/7pm)", refHour: "8:00/9:00 AM" };
      default:
        return { type: "formula1", name: "Fórmula de Entrada", refHour: "8:00/9:00 AM" };
    }
  };

  // --- Extracción Dinámica de Inputs (Auto) ---
  const resolvedInputs = useMemo(() => {
    const targetIndex = HOURS_LIST.indexOf(sistemaxHour);
    const resultsList: Array<{ hour: string; code: string; color: "Rojo" | "Negro" | "Verde"; isEven: boolean; val: number }> = [];

    const classifyColorAndParity = (code: string) => {
      const trimmed = code.trim();
      const val = trimmed === "00" ? 0 : parseInt(trimmed, 10);
      const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
      
      let color: "Rojo" | "Negro" | "Verde" = "Negro";
      if (trimmed === "0" || trimmed === "00") {
        color = "Verde";
      } else if (RED_NUMBERS.has(val)) {
        color = "Rojo";
      }

      const isEven = val % 2 === 0;
      return { color, isEven, val };
    };

    const loteriaKey = sistemaxSelectedLoteria.toUpperCase() === "LA GRANJITA" ? "La Granjita" : (sistemaxSelectedLoteria.toUpperCase() === "SELVA PLUS" ? "Selva Plus" : "Loto Activo");

    // 1. Gather from TODAY (draws state)
    if (targetIndex !== -1) {
      for (let j = targetIndex - 1; j >= 0; j--) {
        const hr = HOURS_LIST[j];
        const code = draws[hr];
        if (code && code.trim() !== "") {
          const { color, isEven, val } = classifyColorAndParity(code);
          resultsList.push({ hour: hr, code, color, isEven, val });
        }
      }
    }

    // 2. Gather from YESTERDAY and earlier
    const pastRecords = accumulatedResults
      .filter(r => r.loteria === loteriaKey && r.fecha < fecha)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    for (const record of pastRecords) {
      if (resultsList.length >= 25) break;
      for (let j = HOURS_LIST.length - 1; j >= 0; j--) {
        const hr = HOURS_LIST[j];
        const code = record.draws[hr];
        if (code && code.trim() !== "") {
          const { color, isEven, val } = classifyColorAndParity(code);
          resultsList.push({ hour: `${record.fecha} ${hr}`, code, color, isEven, val });
        }
      }
    }

    const rojas = resultsList.filter(d => d.color === "Rojo");
    const pares = resultsList.filter(d => d.isEven);
    const paresRojas = resultsList.filter(d => d.color === "Rojo" && d.isEven);
    const imparesNegros = resultsList.filter(d => d.color === "Negro" && !d.isEven);
    const paresNegros = resultsList.filter(d => d.color === "Negro" && d.isEven);
    const imparesRojos = resultsList.filter(d => d.color === "Rojo" && !d.isEven);
    const verdes = resultsList.filter(d => d.color === "Verde");

    const r1 = rojas[0] ? { code: rojas[0].code, src: rojas[0].hour } : { code: "07", src: "Por defecto (Perico)" };
    const r2 = rojas[1] ? { code: rojas[1].code, src: rojas[1].hour } : { code: "05", src: "Por defecto (León)" };
    const p = pares[0] ? { code: pares[0].code, src: pares[0].hour } : { code: "22", src: "Por defecto (Camello)" };

    const pr1 = paresRojas[0] ? { code: paresRojas[0].code, src: paresRojas[0].hour } : { code: "30", src: "Por defecto (Caimán)" };
    const in1 = imparesNegros[0] ? { code: imparesNegros[0].code, src: imparesNegros[0].hour } : { code: "31", src: "Por defecto (Lapa)" };
    const pr2 = paresRojas[1] ? { code: paresRojas[1].code, src: paresRojas[1].hour } : { code: "32", src: "Por defecto (Ardilla)" };
    const pr3 = paresRojas[2] ? { code: paresRojas[2].code, src: paresRojas[2].hour } : { code: "36", src: "Por defecto (Culebra)" };

    const in2 = imparesNegros[0] ? { code: imparesNegros[0].code, src: imparesNegros[0].hour } : { code: "29", src: "Por defecto (Elefante)" };
    const pn1 = paresNegros[0] ? { code: paresNegros[0].code, src: paresNegros[0].hour } : { code: "26", src: "Por defecto (Vaca)" };
    const ir1 = imparesRojos[0] ? { code: imparesRojos[0].code, src: imparesRojos[0].hour } : { code: "01", src: "Por defecto (Carnero)" };
    const ir2 = imparesRojos[1] ? { code: imparesRojos[1].code, src: imparesRojos[1].hour } : { code: "25", src: "Por defecto (Gallina)" };

    const in3 = imparesNegros[0] ? { code: imparesNegros[0].code, src: imparesNegros[0].hour } : { code: "33", src: "Por defecto (Pescado)" };
    const ir3 = imparesRojos[0] ? { code: imparesRojos[0].code, src: imparesRojos[0].hour } : { code: "09", src: "Por defecto (Águila)" };
    const pv1 = verdes[0] ? { code: verdes[0].code, src: verdes[0].hour } : { code: "0", src: "Por defecto (Delfín)" };
    const ir4 = imparesRojos[1] ? { code: imparesRojos[1].code, src: imparesRojos[1].hour } : { code: "27", src: "Por defecto (Perro)" };

    return {
      resultsList,
      formulaType: getFormulaTypeForHour(sistemaxHour),
      inputs: {
        r1, r2, p,
        pr1, in1, pr2, pr3,
        in2, pn1, ir1, ir2,
        in3, ir3, pv1, ir4
      }
    };
  }, [sistemaxHour, sistemaxSelectedLoteria, draws, accumulatedResults, fecha]);

  // --- Proyección Activa (Manual o para hora individual seleccionada) ---
  const activeProjection = useMemo(() => {
    let resultCodes: string[] = [];
    let formulaDesc: string = "";
    let alertMessage: string = "";

    try {
      const fType = resolvedInputs.formulaType.type;
      const inputs = resolvedInputs.inputs;
      const rList = resolvedInputs.resultsList;

      if (sistemaxAuto) {
        if (fType === "formula1") {
          let parVal = 22;
          let beforeCodeStr = "";
          let foundParSource = "Por defecto";
          
          const parIdx = rList.findIndex(d => d.isEven);
          if (parIdx !== -1) {
            parVal = rList[parIdx].val;
            foundParSource = rList[parIdx].hour;
            if (parIdx + 1 < rList.length) {
              beforeCodeStr = rList[parIdx + 1].code;
            }
          }

          const isModulated = beforeCodeStr.trim().startsWith("0") && beforeCodeStr.trim() !== "00" && beforeCodeStr.trim() !== "0";
          const modulatedParVal = isModulated ? (parVal + 7) : parVal;
          const opResultA = wrapAnimalitoCode(modulatedParVal);

          const rojas = rList.filter(d => d.color === "Rojo");
          const r1 = rojas[0] ? rojas[0].val : 7;
          const r2 = rojas[1] ? rojas[1].val : 5;
          const opResultB = wrapAnimalitoCode(r1 + r2);

          resultCodes = [opResultA, opResultB];
          formulaDesc = `Lógica Animal 1: Último Par es ${formatToTwoDigits(parVal)} (${foundParSource}). El anterior fue ${beforeCodeStr || "N/A"}. ${isModulated ? `Empieza por 0 (+7) -> ${modulatedParVal}` : "No modificado"}. Proyección A = ${opResultA} | Lógica Animal 2 (Rojos): ${formatToTwoDigits(r1)} + ${formatToTwoDigits(r2)} = ${r1 + r2} -> Proyección B = ${opResultB}`;
          alertMessage = `Proyección de Entrada (${sistemaxHour})`;
        } 
        else if (fType === "formula2") {
          const drawnEarly = rList.some(d => d.code === "12" || d.code === "29");
          if (!drawnEarly) {
            resultCodes = ["12", "29"];
            formulaDesc = `Lógica de Control: No se detectó salida de 12 (Caballo) ni 29 (Elefante). Se activa Arrastre Fijo Directo para ambos.`;
            alertMessage = `Arrastre Fijo Activado (12 & 29)`;
          } else {
            const parRojoItem = rList.find(d => d.isEven && d.color === "Rojo");
            const imparNegroItem = rList.find(d => !d.isEven && d.color === "Negro");
            
            const prVal = parRojoItem ? parRojoItem.val : 30;
            const inVal = imparNegroItem ? imparNegroItem.val : 31;
            const diffOpuestos = Math.abs(inVal - prVal);
            const opResultA = wrapAnimalitoCode(diffOpuestos);

            const code1 = rList[0] ? rList[0].code : "32";
            const code2 = rList[1] ? rList[1].code : "36";
            const sumDigits1 = getDigitSum(code1);
            const sumDigits2 = getDigitSum(code2);
            const opResultB = wrapAnimalitoCode(sumDigits1 + sumDigits2);

            resultCodes = [opResultA, opResultB];
            formulaDesc = `Lógica Animal 1: |Impar Negro (${formatToTwoDigits(inVal)}) - Par Rojo (${formatToTwoDigits(prVal)})| = ${diffOpuestos} -> Proyección A = ${opResultA} | Lógica Animal 2: Último ${code1} (${sumDigits1}) + Penúltimo ${code2} (${sumDigits2}) = ${sumDigits1 + sumDigits2} -> Proyección B = ${opResultB}`;
            alertMessage = `Proyección de Continuación 10:00 AM (${sistemaxHour})`;
          }
        } 
        else if (fType === "formula3") {
          const impNegroItem = rList.find(d => !d.isEven && d.color === "Negro");
          const parNegroItem = rList.find(d => d.isEven && d.color === "Negro");
          
          const inVal = impNegroItem ? impNegroItem.val : 29;
          const pnVal = parNegroItem ? parNegroItem.val : 26;
          const restaSimilares = Math.abs(inVal - pnVal);
          const opResultA = wrapAnimalitoCode(restaSimilares);

          const rojas = rList.filter(d => d.color === "Rojo");
          const r1 = rojas[0] ? rojas[0].val : 1;
          const r2 = rojas[1] ? rojas[1].val : 25;
          const sumaBaseRoja = r1 + r2;
          const opResultB = wrapAnimalitoCode(sumaBaseRoja);

          resultCodes = [opResultA, opResultB];
          formulaDesc = `Lógica Animal 1: |Impar Negro (${formatToTwoDigits(inVal)}) - Par Negro (${formatToTwoDigits(pnVal)})| = ${restaSimilares} -> Proyección A = ${opResultA} | Lógica Animal 2: Dos rojos ${formatToTwoDigits(r1)} + ${formatToTwoDigits(r2)} = ${sumaBaseRoja} -> Proyección B = ${opResultB}`;
          alertMessage = `Proyección de Continuación 11:00 AM (${sistemaxHour})`;
        } 
        else if (fType === "formula4") {
          const impares = rList.filter(d => !d.isEven);
          const imp1 = impares[0] ? impares[0].val : 33;
          const imp2 = impares[1] ? impares[1].val : 9;
          const hiloAVal = Math.floor((imp1 + imp2) / 3);
          const opResultA = wrapAnimalitoCode(hiloAVal);

          const lastGeneralCode = rList[0] ? rList[0].code : "27";
          const lastGeneralVal = parseInt(lastGeneralCode, 10) || 0;
          const decenas = Math.floor(lastGeneralVal / 10);
          const unidades = lastGeneralVal % 10;
          const rawDiff = unidades - decenas;
          const hiloBVal = Math.abs(rawDiff);
          const opResultB = wrapAnimalitoCode(hiloBVal);

          if (hiloAVal === hiloBVal) {
            resultCodes = [opResultA];
            formulaDesc = `🎯 ¡COINCIDENCIA EXACTA! Hilo A y B dieron ${hiloAVal}. Hilo A: (${imp1} + ${imp2}) / 3 = ${hiloAVal} | Hilo B: Último ${lastGeneralCode} (Unidades ${unidades} - Decenas ${decenas} = ${rawDiff})`;
            alertMessage = `🎯 ¡FIJO CONFIRMADO: ${opResultA}!`;
          } else {
            resultCodes = [opResultA, opResultB];
            formulaDesc = `Hilo A: (${imp1} + ${imp2}) / 3 = ${hiloAVal} -> Proyección A = ${opResultA} | Hilo B: Último ${lastGeneralCode} -> Unidades ${unidades} - Decenas ${decenas} = ${rawDiff} -> Proyección B = ${opResultB}`;
            alertMessage = `Proyección 12:00 PM Fijo (${sistemaxHour})`;
          }
        }
      } else {
        // MODO MANUAL
        if (fType === "formula1") {
          const r1 = parseInt(sistemaxRojo1, 10) || 7;
          const r2 = parseInt(sistemaxRojo2, 10) || 5;
          const parVal = parseInt(sistemaxPar, 10) || 22;

          let beforeCodeStr = "";
          const parIdx = rList.findIndex(d => d.val === parVal);
          if (parIdx !== -1 && parIdx + 1 < rList.length) {
            beforeCodeStr = rList[parIdx + 1].code;
          }
          const isModulated = beforeCodeStr.trim().startsWith("0") && beforeCodeStr.trim() !== "00" && beforeCodeStr.trim() !== "0";
          const modulatedParVal = isModulated ? (parVal + 7) : parVal;
          const opResultA = wrapAnimalitoCode(modulatedParVal);
          const opResultB = wrapAnimalitoCode(r1 + r2);

          resultCodes = [opResultA, opResultB];
          formulaDesc = `[MANUAL] Lógica Animal 1: Par es ${formatToTwoDigits(parVal)}. Modulado: ${isModulated ? `${parVal} + 7 = ${modulatedParVal}` : "Sin cambio"}. Proyección A = ${opResultA} | Lógica 2: Suma de rojos ${formatToTwoDigits(r1)} + ${formatToTwoDigits(r2)} = ${r1 + r2} -> Proyección B = ${opResultB}`;
          alertMessage = `Proyección Manual de Entrada (${sistemaxHour})`;
        } 
        else if (fType === "formula2") {
          if (!sistemaxSalieronTemprano) {
            resultCodes = ["12", "29"];
            formulaDesc = `[MANUAL] Lógica de Control: Arrastre Fijo Directo de 12 (Caballo) y 29 (Elefante) por no salida temprana de estos.`;
            alertMessage = `Arrastre Fijo Directo (12 & 29)`;
          } else {
            const prVal = parseInt(sistemaxParRojo, 10) || 30;
            const inVal = parseInt(sistemaxImparNegro, 10) || 31;
            const diffOpuestos = Math.abs(inVal - prVal);
            const opResultA = wrapAnimalitoCode(diffOpuestos);

            const code1 = sistemaxParRojo2 || "32";
            const code2 = sistemaxParRojo3 || "36";
            const sumDigits1 = getDigitSum(code1);
            const sumDigits2 = getDigitSum(code2);
            const opResultB = wrapAnimalitoCode(sumDigits1 + sumDigits2);

            resultCodes = [opResultA, opResultB];
            formulaDesc = `[MANUAL] Lógica Animal 1: |Impar Negro manual (${formatToTwoDigits(inVal)}) - Par Rojo manual (${formatToTwoDigits(prVal)})| = ${diffOpuestos} -> Proyección A = ${opResultA} | Lógica Animal 2: Primer par manual ${code1} (${sumDigits1}) + Segundo par manual ${code2} (${sumDigits2}) = ${sumDigits1 + sumDigits2} -> Proyección B = ${opResultB}`;
            alertMessage = `Proyección Manual 10:00 AM (${sistemaxHour})`;
          }
        } 
        else if (fType === "formula3") {
          const inVal = parseInt(sistemaxImparNegro2, 10) || 29;
          const pnVal = parseInt(sistemaxParNegro, 10) || 26;
          const restaSimilares = Math.abs(inVal - pnVal);
          const opResultA = wrapAnimalitoCode(restaSimilares);

          const r1 = parseInt(sistemaxImparRojo1, 10) || 1;
          const r2 = parseInt(sistemaxImparRojo2, 10) || 25;
          const sumaBaseRoja = r1 + r2;
          const opResultB = wrapAnimalitoCode(sumaBaseRoja);

          resultCodes = [opResultA, opResultB];
          formulaDesc = `[MANUAL] Lógica Animal 1: |Impar Negro manual (${formatToTwoDigits(inVal)}) - Par Negro manual (${formatToTwoDigits(pnVal)})| = ${restaSimilares} -> Proyección A = ${opResultA} | Lógica Animal 2: Rojos manuales ${formatToTwoDigits(r1)} + ${formatToTwoDigits(r2)} = ${sumaBaseRoja} -> Proyección B = ${opResultB}`;
          alertMessage = `Proyección Manual 11:00 AM (${sistemaxHour})`;
        } 
        else if (fType === "formula4") {
          const imp1 = parseInt(sistemaxImparNegro3, 10) || 33;
          const imp2 = parseInt(sistemaxImparRojo3, 10) || 9;
          const hiloAVal = Math.floor((imp1 + imp2) / 3);
          const opResultA = wrapAnimalitoCode(hiloAVal);

          const lastGeneralCode = sistemaxImparRojo4 || "27";
          const lastGeneralVal = parseInt(lastGeneralCode, 10) || 0;
          const decenas = Math.floor(lastGeneralVal / 10);
          const unidades = lastGeneralVal % 10;
          const rawDiff = unidades - decenas;
          const hiloBVal = Math.abs(rawDiff);
          const opResultB = wrapAnimalitoCode(hiloBVal);

          if (hiloAVal === hiloBVal) {
            resultCodes = [opResultA];
            formulaDesc = `🎯 [MANUAL] COINCIDENCIA EXACTA! Ambos hilos dieron ${hiloAVal}. Hilo A: (${imp1} + ${imp2}) / 3 = ${hiloAVal} | Hilo B: Manual ${lastGeneralCode} (Unidades ${unidades} - Decenas ${decenas} = ${rawDiff})`;
            alertMessage = `🎯 ¡FIJO CONFIRMADO: ${opResultA}!`;
          } else {
            resultCodes = [opResultA, opResultB];
            formulaDesc = `[MANUAL] Hilo A: (${imp1} + ${imp2}) / 3 = ${hiloAVal} -> Proyección A = ${opResultA} | Hilo B: Manual ${lastGeneralCode} -> Unidades ${unidades} - Decenas ${decenas} = ${rawDiff} -> Proyección B = ${opResultB}`;
            alertMessage = `Proyección Manual 12:00 PM (${sistemaxHour})`;
          }
        }
      }

      // Convert to rich elements
      const results = resultCodes.map(code => {
        const cleanedCode = code === "0" || code === "00" ? code : parseInt(code, 10).toString();
        const meta = ANIMALITOS[cleanedCode];
        return {
          code,
          name: meta ? meta.name : "Desconocido",
          emoji: meta ? meta.emoji : "❓",
          label: meta ? `${code} (${meta.name}) ${meta.emoji}` : `${code}`
        };
      });

      // Simulation of Arrastre for the selected hour to show on the manual preview card
      const targetIndex = HOURS_LIST.indexOf(sistemaxHour);
      let simulatedArrastre: string[] = [];
      const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
      
      const classifyLocal = (cd: string) => {
        const trimmed = cd.trim();
        const v = trimmed === "00" ? 0 : parseInt(trimmed, 10);
        let color: "Rojo" | "Negro" | "Verde" = "Negro";
        if (trimmed === "0" || trimmed === "00") color = "Verde";
        else if (RED_NUMBERS.has(v)) color = "Rojo";
        const isEven = v % 2 === 0;
        return { color, isEven, val: v };
      };

      for (let i = 0; i <= targetIndex; i++) {
        const hr = HOURS_LIST[i];
        let baseCodes: string[] = [];

        if (i === targetIndex) {
          baseCodes = resultCodes;
        } else {
          const fTypeObj = getFormulaTypeForHour(hr);
          const localRList: any[] = [];
          
          for (let j = i - 1; j >= 0; j--) {
            const code = draws[HOURS_LIST[j]];
            if (code && code.trim() !== "") {
              const { color, isEven, val } = classifyLocal(code);
              localRList.push({ hour: HOURS_LIST[j], code, color, isEven, val });
            }
          }

          const loteriaKey = sistemaxSelectedLoteria.toUpperCase() === "LA GRANJITA" ? "La Granjita" : (sistemaxSelectedLoteria.toUpperCase() === "SELVA PLUS" ? "Selva Plus" : "Loto Activo");
          const pastRecords = accumulatedResults
            .filter(r => r.loteria === loteriaKey && r.fecha < fecha)
            .sort((a, b) => b.fecha.localeCompare(a.fecha));

          for (const record of pastRecords) {
            if (localRList.length >= 25) break;
            for (let j = HOURS_LIST.length - 1; j >= 0; j--) {
              const code = record.draws[HOURS_LIST[j]];
              if (code && code.trim() !== "") {
                const { color, isEven, val } = classifyLocal(code);
                localRList.push({ hour: `${record.fecha} ${HOURS_LIST[j]}`, code, color, isEven, val });
              }
            }
          }

          if (fTypeObj.type === "formula1") {
            let parVal = 22;
            let beforeCodeStr = "";
            const parIdx = localRList.findIndex(d => d.isEven);
            if (parIdx !== -1) {
              parVal = localRList[parIdx].val;
              if (parIdx + 1 < localRList.length) beforeCodeStr = localRList[parIdx + 1].code;
            }
            const isModulated = beforeCodeStr.trim().startsWith("0") && beforeCodeStr.trim() !== "00" && beforeCodeStr.trim() !== "0";
            const modulatedParVal = isModulated ? (parVal + 7) : parVal;
            const opResultA = wrapAnimalitoCode(modulatedParVal);

            const rojas = localRList.filter(d => d.color === "Rojo");
            const r1 = rojas[0] ? rojas[0].val : 7;
            const r2 = rojas[1] ? rojas[1].val : 5;
            const opResultB = wrapAnimalitoCode(r1 + r2);
            baseCodes = [opResultA, opResultB];
          } 
          else if (fTypeObj.type === "formula2") {
            const drawnEarly = localRList.some(d => d.code === "12" || d.code === "29");
            if (!drawnEarly) {
              baseCodes = ["12", "29"];
            } else {
              const parRojoItem = localRList.find(d => d.isEven && d.color === "Rojo");
              const imparNegroItem = localRList.find(d => !d.isEven && d.color === "Negro");
              const prVal = parRojoItem ? parRojoItem.val : 30;
              const inVal = imparNegroItem ? imparNegroItem.val : 31;
              const opResultA = wrapAnimalitoCode(Math.abs(inVal - prVal));

              const code1 = localRList[0] ? localRList[0].code : "32";
              const code2 = localRList[1] ? localRList[1].code : "36";
              const opResultB = wrapAnimalitoCode(getDigitSum(code1) + getDigitSum(code2));
              baseCodes = [opResultA, opResultB];
            }
          } 
          else if (fTypeObj.type === "formula3") {
            const impNegroItem = localRList.find(d => !d.isEven && d.color === "Negro");
            const parNegroItem = localRList.find(d => d.isEven && d.color === "Negro");
            const inVal = impNegroItem ? impNegroItem.val : 29;
            const pnVal = parNegroItem ? parNegroItem.val : 26;
            const opResultA = wrapAnimalitoCode(Math.abs(inVal - pnVal));

            const rojas = localRList.filter(d => d.color === "Rojo");
            const r1 = rojas[0] ? rojas[0].val : 1;
            const r2 = rojas[1] ? rojas[1].val : 25;
            baseCodes = [opResultA, wrapAnimalitoCode(r1 + r2)];
          } 
          else if (fTypeObj.type === "formula4") {
            const impares = localRList.filter(d => !d.isEven);
            const imp1 = impares[0] ? impares[0].val : 33;
            const imp2 = impares[1] ? impares[1].val : 9;
            const hiloAVal = Math.floor((imp1 + imp2) / 3);
            const opResultA = wrapAnimalitoCode(hiloAVal);

            const lastGeneralCode = localRList[0] ? localRList[0].code : "27";
            const lastGeneralVal = parseInt(lastGeneralCode, 10) || 0;
            const rawDiff = (lastGeneralVal % 10) - Math.floor(lastGeneralVal / 10);
            const hiloBVal = Math.abs(rawDiff);
            const opResultB = wrapAnimalitoCode(hiloBVal);

            baseCodes = hiloAVal === hiloBVal ? [opResultA] : [opResultA, opResultB];
          }
        }

        const preArrastre = [...simulatedArrastre];
        const combined = Array.from(new Set([...baseCodes, ...preArrastre]));

        const realCode = draws[hr];
        if (realCode && realCode.trim() !== "") {
          const isHit = combined.includes(realCode);
          if (isHit) {
            simulatedArrastre = [];
          } else {
            simulatedArrastre = Array.from(new Set([...simulatedArrastre, ...baseCodes]));
          }
        }
      }

      const preDrawArrastre = [...simulatedArrastre];
      const suggestedPlay = Array.from(new Set([...resultCodes, ...preDrawArrastre]));

      return {
        results,
        formulaDesc,
        alertMessage,
        arrastre: preDrawArrastre,
        jugadaFinal: suggestedPlay
      };

    } catch (err) {
      console.error(err);
      return {
        results: [],
        formulaDesc: "Error en el cálculo matemático.",
        alertMessage: "Error de cálculo",
        arrastre: [],
        jugadaFinal: []
      };
    }
  }, [
    sistemaxHour,
    sistemaxAuto,
    sistemaxRojo1,
    sistemaxRojo2,
    sistemaxPar,
    sistemaxSalieronTemprano,
    sistemaxParRojo,
    sistemaxImparNegro,
    sistemaxParRojo2,
    sistemaxParRojo3,
    sistemaxImparNegro2,
    sistemaxParNegro,
    sistemaxImparRojo1,
    sistemaxImparRojo2,
    sistemaxImparNegro3,
    sistemaxImparRojo3,
    sistemaxParVerde,
    sistemaxImparRojo4,
    sistemaxSelectedLoteria,
    resolvedInputs,
    draws,
    accumulatedResults,
    fecha
  ]);

  // --- Cronología Completa de Progresiones del Día (100% Automático) ---
  const sistemaxTimeline = useMemo(() => {
    const timeline: any[] = [];
    let simulatedArrastre: string[] = [];

    const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
    const classifyLocal = (cd: string) => {
      const trimmed = cd.trim();
      const v = trimmed === "00" ? 0 : parseInt(trimmed, 10);
      let color: "Rojo" | "Negro" | "Verde" = "Negro";
      if (trimmed === "0" || trimmed === "00") color = "Verde";
      else if (RED_NUMBERS.has(v)) color = "Rojo";
      const isEven = v % 2 === 0;
      return { color, isEven, val: v };
    };

    for (let i = 0; i < HOURS_LIST.length; i++) {
      const hr = HOURS_LIST[i];
      const fTypeObj = getFormulaTypeForHour(hr);

      // Gather past data from previous slots of today and yesterday
      const localRList: any[] = [];
      for (let j = i - 1; j >= 0; j--) {
        const code = draws[HOURS_LIST[j]];
        if (code && code.trim() !== "") {
          const { color, isEven, val } = classifyLocal(code);
          localRList.push({ hour: HOURS_LIST[j], code, color, isEven, val });
        }
      }

      const loteriaKey = sistemaxSelectedLoteria.toUpperCase() === "LA GRANJITA" ? "La Granjita" : (sistemaxSelectedLoteria.toUpperCase() === "SELVA PLUS" ? "Selva Plus" : "Loto Activo");
      const pastRecords = accumulatedResults
        .filter(r => r.loteria === loteriaKey && r.fecha < fecha)
        .sort((a, b) => b.fecha.localeCompare(a.fecha));

      for (const record of pastRecords) {
        if (localRList.length >= 25) break;
        for (let j = HOURS_LIST.length - 1; j >= 0; j--) {
          const code = record.draws[HOURS_LIST[j]];
          if (code && code.trim() !== "") {
            const { color, isEven, val } = classifyLocal(code);
            localRList.push({ hour: `${record.fecha} ${HOURS_LIST[j]}`, code, color, isEven, val });
          }
        }
      }

      let baseCodes: string[] = [];

      // Calculate base projection for this hour
      if (fTypeObj.type === "formula1") {
        let parVal = 22;
        let beforeCodeStr = "";
        const parIdx = localRList.findIndex(d => d.isEven);
        if (parIdx !== -1) {
          parVal = localRList[parIdx].val;
          if (parIdx + 1 < localRList.length) beforeCodeStr = localRList[parIdx + 1].code;
        }
        const isModulated = beforeCodeStr.trim().startsWith("0") && beforeCodeStr.trim() !== "00" && beforeCodeStr.trim() !== "0";
        const modulatedParVal = isModulated ? (parVal + 7) : parVal;
        const opResultA = wrapAnimalitoCode(modulatedParVal);

        const rojas = localRList.filter(d => d.color === "Rojo");
        const r1 = rojas[0] ? rojas[0].val : 7;
        const r2 = rojas[1] ? rojas[1].val : 5;
        const opResultB = wrapAnimalitoCode(r1 + r2);
        baseCodes = [opResultA, opResultB];
      } 
      else if (fTypeObj.type === "formula2") {
        const drawnEarly = localRList.some(d => d.code === "12" || d.code === "29");
        if (!drawnEarly) {
          baseCodes = ["12", "29"];
        } else {
          const parRojoItem = localRList.find(d => d.isEven && d.color === "Rojo");
          const imparNegroItem = localRList.find(d => !d.isEven && d.color === "Negro");
          const prVal = parRojoItem ? parRojoItem.val : 30;
          const inVal = imparNegroItem ? imparNegroItem.val : 31;
          const opResultA = wrapAnimalitoCode(Math.abs(inVal - prVal));

          const code1 = localRList[0] ? localRList[0].code : "32";
          const code2 = localRList[1] ? localRList[1].code : "36";
          const opResultB = wrapAnimalitoCode(getDigitSum(code1) + getDigitSum(code2));
          baseCodes = [opResultA, opResultB];
        }
      } 
      else if (fTypeObj.type === "formula3") {
        const impNegroItem = localRList.find(d => !d.isEven && d.color === "Negro");
        const parNegroItem = localRList.find(d => d.isEven && d.color === "Negro");
        const inVal = impNegroItem ? impNegroItem.val : 29;
        const pnVal = parNegroItem ? parNegroItem.val : 26;
        const opResultA = wrapAnimalitoCode(Math.abs(inVal - pnVal));

        const rojas = localRList.filter(d => d.color === "Rojo");
        const r1 = rojas[0] ? rojas[0].val : 1;
        const r2 = rojas[1] ? rojas[1].val : 25;
        baseCodes = [opResultA, wrapAnimalitoCode(r1 + r2)];
      } 
      else if (fTypeObj.type === "formula4") {
        const impares = localRList.filter(d => !d.isEven);
        const imp1 = impares[0] ? impares[0].val : 33;
        const imp2 = impares[1] ? impares[1].val : 9;
        const hiloAVal = Math.floor((imp1 + imp2) / 3);
        const opResultA = wrapAnimalitoCode(hiloAVal);

        const lastGeneralCode = localRList[0] ? localRList[0].code : "27";
        const lastGeneralVal = parseInt(lastGeneralCode, 10) || 0;
        const rawDiff = (lastGeneralVal % 10) - Math.floor(lastGeneralVal / 10);
        const hiloBVal = Math.abs(rawDiff);
        const opResultB = wrapAnimalitoCode(hiloBVal);

        baseCodes = hiloAVal === hiloBVal ? [opResultA] : [opResultA, opResultB];
      }

      const preDrawArrastre = [...simulatedArrastre];
      const suggestedPlay = Array.from(new Set([...baseCodes, ...preDrawArrastre]));

      const realResult = draws[hr];
      let status = "PENDIENTE";

      if (realResult && realResult.trim() !== "") {
        const isHit = suggestedPlay.includes(realResult);
        if (isHit) {
          status = "ACIERTO";
          simulatedArrastre = []; // Reset arrastre on win!
        } else {
          status = "FALLO";
          simulatedArrastre = Array.from(new Set([...simulatedArrastre, ...baseCodes])); // Accumulate failed bases!
        }
      }

      timeline.push({
        hour: hr,
        formulaName: fTypeObj.name,
        baseCodes,
        preDrawArrastre,
        suggestedPlay,
        realResult,
        status,
        postDrawArrastre: [...simulatedArrastre]
      });
    }

    return timeline;
  }, [sistemaxSelectedLoteria, draws, accumulatedResults, fecha]);

  const nextPendingHourObj = useMemo(() => {
    return sistemaxTimeline.find(t => t.status === "PENDIENTE") || sistemaxTimeline[sistemaxTimeline.length - 1];
  }, [sistemaxTimeline]);

  // --- Registrar Cálculos Manuales ---
  const handleCalculateSistemaX = () => {
    playSound("click");
    if (!activeProjection) {
      addLog("WAR: No hay una proyección activa calculada.");
      return;
    }
    const timeNow = new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const inputsUsed = sistemaxAuto ? {
      r1: resolvedInputs.inputs.r1.code,
      r2: resolvedInputs.inputs.r2.code,
      par: resolvedInputs.inputs.p.code,
      salieronTemprano: false,
      parRojo: resolvedInputs.inputs.pr1.code,
      imparNegro: resolvedInputs.inputs.in1.code,
      parRojo2: resolvedInputs.inputs.pr2.code,
      parRojo3: resolvedInputs.inputs.pr3.code,
      imparNegro2: resolvedInputs.inputs.in2.code,
      parNegro: resolvedInputs.inputs.pn1.code,
      imparRojo1: resolvedInputs.inputs.ir1.code,
      imparRojo2: resolvedInputs.inputs.ir2.code,
      imparNegro3: resolvedInputs.inputs.in3.code,
      imparRojo3: resolvedInputs.inputs.ir3.code,
      parVerde: resolvedInputs.inputs.pv1.code,
      imparRojo4: resolvedInputs.inputs.ir4.code
    } : {
      rojo1: sistemaxRojo1,
      rojo2: sistemaxRojo2,
      par: sistemaxPar,
      salieronTemprano: sistemaxSalieronTemprano,
      parRojo: sistemaxParRojo,
      imparNegro: sistemaxImparNegro,
      parRojo2: sistemaxParRojo2,
      parRojo3: sistemaxParRojo3,
      imparNegro2: sistemaxImparNegro2,
      parNegro: sistemaxParNegro,
      imparRojo1: sistemaxImparRojo1,
      imparRojo2: sistemaxImparRojo2,
      imparNegro3: sistemaxImparNegro3,
      imparRojo3: sistemaxImparRojo3,
      parVerde: sistemaxParVerde,
      imparRojo4: sistemaxImparRojo4
    };

    const newLog = {
      id: "log_" + Date.now(),
      time: timeNow,
      loteria: sistemaxSelectedLoteria,
      selectedHour: sistemaxHour,
      formulaName: resolvedInputs.formulaType.name,
      inputs: inputsUsed,
      baseProjections: activeProjection.results,
      arrastre: activeProjection.arrastre,
      suggestedPlay: activeProjection.jugadaFinal,
      description: activeProjection.formulaDesc,
      alert: activeProjection.alertMessage,
      auto: sistemaxAuto
    };

    setSistemaxLogs(prev => [newLog, ...prev]);
    addLog(`SISTEMA DE LAS X: Proyección registrada para sorteo de las ${sistemaxHour}.`);
  };

  const handleClearSistemaxLogs = () => {
    playSound("trash");
    setSistemaxLogs([]);
    addLog("SISTEMA DE LAS X: Monitor histórico de cálculos manuales limpiado.");
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Título de Sección */}
      <div className={`${cardTheme} p-6 flex flex-col lg:flex-row gap-5 justify-between lg:items-center relative overflow-hidden`}>
        <div className="max-w-xl z-10">
          <h3 className="text-base md:text-lg font-black uppercase tracking-wide text-emerald-400 mb-1.5 flex items-center gap-2 leading-none">
            <span>⚡</span> SISTEMA DE CÁLCULO DE LAS X (MÓDULO AUTOMÁTICO DE LOTERÍA)
          </h3>
          <p className={`text-xs md:text-sm leading-relaxed font-sans ${textMutedTheme}`}>
            El "Sistema de las X" es un hilo temporal continuo de 12 sorteos diarios. En modo <strong>Inteligente (Auto)</strong>, el sistema calcula de forma 100% automática la progresión, acumulando los arrastres correspondientes sorteo tras sorteo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto shrink-0 z-10">
          <div className="w-full sm:w-56">
            <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">🎰 Lotería Activa:</label>
            <select
              value={sistemaxSelectedLoteria}
              onChange={(e) => { 
                const val = e.target.value;
                playSound("click"); 
                setSistemaxSelectedLoteria(val); 
                if (onChangeLoteria) {
                  const targetParent = val === "LA GRANJITA" ? "La Granjita" : val === "SELVA PLUS" ? "Selva Plus" : "Loto Activo";
                  onChangeLoteria(targetParent);
                }
              }}
              className={`w-full p-2.5 rounded-xl font-bold text-xs cursor-pointer select-none border ${
                darkMode ? "bg-[#182033] border-slate-700/60 text-white" : "bg-white border-black text-black"
              }`}
            >
              <option value="LOTTO ACTIVO">Lotto Activo</option>
              <option value="LA GRANJITA">La Granjita</option>
              <option value="SELVA PLUS">Selva Plus</option>
            </select>
            <span className="text-[8.5px] text-slate-400 font-sans mt-1 block leading-tight">ℹ️ Lotto Activo, La Granjita y Selva Plus sortean los mismos 38 animales (0, 00 al 36)</span>
          </div>

          <div className="w-full sm:w-48">
            <label className="text-[10px] font-black uppercase text-slate-300 block mb-1">⚙️ Modo de Uso:</label>
            <select
              value={sistemaxAuto ? "auto" : "manual"}
              onChange={(e) => { playSound("click"); setSistemaxAuto(e.target.value === "auto"); }}
              className={`w-full p-2.5 rounded-xl font-bold text-xs cursor-pointer select-none border ${
                darkMode ? "bg-[#182033] border-slate-700/60 text-white" : "bg-white border-black text-black"
              }`}
            >
              <option value="auto">🧠 Inteligente (Auto)</option>
              <option value="manual">✍️ Modo Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* MODO INTELIGENTE (AUTO) - DASHBOARD COMPLETO DEL DÍA */}
      {sistemaxAuto ? (
        <div className="space-y-6 animate-fadeIn">
          {/* Panel de Estadísticas Generales del Día (HOY) */}
          {(() => {
            const playedDraws = sistemaxTimeline.filter(t => t.status !== "PENDIENTE");
            const winsToday = playedDraws.filter(t => t.status === "ACIERTO");
            const winRate = playedDraws.length > 0 ? (winsToday.length / playedDraws.length * 100).toFixed(1) : "0.0";
            const currentArrastre = nextPendingHourObj?.preDrawArrastre || [];

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`${cardTheme} p-4.5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden border border-emerald-500/10`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Eficiencia de Hoy</span>
                    <div className="text-2xl font-black font-display text-emerald-400">{winRate}%</div>
                    <span className="text-[10px] text-slate-400 block font-semibold">{winsToday.length} de {playedDraws.length} sorteos ganados</span>
                  </div>
                  <span className="text-3xl filter drop-shadow opacity-95">🏆</span>
                </div>

                <div className={`${cardTheme} p-4.5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden border border-amber-500/10`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Arrastre en Progreso</span>
                    <div className="text-2xl font-black font-display text-amber-500">{currentArrastre.length}</div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Animales acumulados activos</span>
                  </div>
                  <span className="text-3xl filter drop-shadow opacity-95">⛓️</span>
                </div>

                <div className={`${cardTheme} p-4.5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden border border-indigo-500/10`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Sorteos Jugados</span>
                    <div className="text-2xl font-black font-display text-indigo-400">{playedDraws.length} / 12</div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Horarios procesados hoy</span>
                  </div>
                  <span className="text-3xl filter drop-shadow opacity-95">⏱️</span>
                </div>

                <div className={`${cardTheme} p-4.5 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden border border-cyan-500/10`}>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Estado del Algoritmo</span>
                    <div className="text-2xl font-black font-display text-cyan-400 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                      <span>AUTOMÁTICO</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Cálculo de hilo continuo</span>
                  </div>
                  <span className="text-3xl filter drop-shadow opacity-95">⚡</span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-12 gap-6">
            {/* PRÓXIMO SORTEO / JUGADA EN CURSO */}
            <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
              <div className={`${cardTheme} p-6 flex flex-col gap-5 shadow-lg border border-emerald-500/30 relative overflow-hidden flex-grow`}>
                <div className="border-b border-emerald-500/10 pb-3">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
                    ⏱️ Próxima Jugada Activa
                  </span>
                  <h4 className="text-sm font-black uppercase text-zinc-155 font-display leading-tight">
                    RECOMENDACIÓN: {nextPendingHourObj.hour}
                  </h4>
                  <p className={`text-[11px] leading-relaxed mt-1 ${textMutedTheme}`}>
                    Proyección sugerida para la hora actual o siguiente sorteo pendiente, calculando su base combinada con el arrastre activo.
                  </p>
                </div>

                <div className="space-y-5 flex-grow">
                  {/* Bases de la Fórmula */}
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                      1. PROYECCIÓN BASE ({nextPendingHourObj.baseCodes.length} animales):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {nextPendingHourObj.baseCodes.map((code, idx) => {
                        const meta = ANIMALITOS[code === "0" || code === "00" ? code : parseInt(code, 10).toString()];
                        return (
                          <div key={`${code}-${idx}`} className={`p-2 rounded-xl border flex items-center gap-2 ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
                            <span className="text-lg">{meta?.emoji || "❓"}</span>
                            <div>
                              <span className="text-[8px] font-mono font-bold text-zinc-500 block">#{code}</span>
                              <span className="text-[11px] font-black uppercase text-zinc-155 leading-none">{meta?.name || "Desconocido"}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Arrastre */}
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 block mb-2">
                      2. ARRASTRE ACUMULADO ACTIVO ({nextPendingHourObj.preDrawArrastre.length} animales):
                    </span>
                    {nextPendingHourObj.preDrawArrastre.length === 0 ? (
                      <span className="text-[11px] italic text-slate-500 block py-1.5 bg-black/10 px-3 rounded-lg border border-dashed border-slate-800">
                        Ninguno. ¡La lista de arrastre está vacía! ✨
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {nextPendingHourObj.preDrawArrastre.map((code, idx) => {
                          const meta = ANIMALITOS[code === "0" || code === "00" ? code : parseInt(code, 10).toString()];
                          return (
                            <div key={`${code}-${idx}`} className={`p-2 rounded-xl border flex items-center gap-2 ${darkMode ? "bg-amber-950/20 border-amber-500/20" : "bg-amber-50 border-amber-200"}`}>
                              <span className="text-lg">{meta?.emoji || "❓"}</span>
                              <div>
                                <span className="text-[8px] font-mono font-bold text-amber-500 block">#{code}</span>
                                <span className="text-[11px] font-black uppercase text-amber-500 leading-none">{meta?.name || "Desconocido"}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Jugada Final */}
                  <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-450 block text-center font-bold">
                      👑 JUGADA FINAL RECOMENDADA (BASE + ARRASTRE):
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {nextPendingHourObj.suggestedPlay.map((code, idx) => {
                        const meta = ANIMALITOS[code === "0" || code === "00" ? code : parseInt(code, 10).toString()];
                        return (
                          <div key={`${code}-${idx}`} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all w-20 h-20 relative overflow-hidden ${
                            darkMode ? "bg-slate-950 border-emerald-500/30" : "bg-emerald-50 border-black shadow"
                          }`}>
                            <span className="absolute top-1 left-1.5 font-mono text-[8px] font-bold text-zinc-500">#{code}</span>
                            <span className="text-xl filter drop-shadow mb-0.5">{meta?.emoji || "❓"}</span>
                            <span className="text-[9px] font-black uppercase text-emerald-400 truncate max-w-full">{meta?.name || "Desconocido"}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border text-[11px] leading-relaxed font-sans ${
                  darkMode ? "bg-slate-900/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <strong>Estructura para este sorteo:</strong> {nextPendingHourObj.formulaName}
                </div>
              </div>
            </div>

            {/* CRONOGRAMA DE PROGRESIONES DIARIAS */}
            <div className="col-span-12 xl:col-span-8 flex flex-col gap-6">
              <div className={`${cardTheme} p-6 flex flex-col gap-5 shadow-md`}>
                <div className="border-b border-slate-200/10 pb-3">
                  <h4 className="text-sm font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-display leading-none">
                    <span>📅</span> SEGUIMIENTO HISTÓRICO DE HOY (LO HECHO EN EL DÍA)
                  </h4>
                  <p className={`text-[11px] leading-relaxed mt-1 ${textMutedTheme}`}>
                    Monitoreo automático sorteo a sorteo. Te muestra qué se pronosticó, qué arrastre había, cuál fue la jugada recomendada, y si se obtuvo un ACIERTO (Ganado) o se acumuló al ARRASTRE.
                  </p>
                </div>

                {/* Timeline List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                  {sistemaxTimeline.map((item, idx) => {
                    const played = item.status !== "PENDIENTE";
                    const hit = item.status === "ACIERTO";
                    const isNext = nextPendingHourObj.hour === item.hour;

                    return (
                      <div
                        key={item.hour}
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative ${
                          isNext 
                            ? "bg-emerald-500/5 border-emerald-500/40 shadow-md scale-[1.01]"
                            : hit 
                              ? "bg-emerald-950/10 border-emerald-500/20" 
                              : played 
                                ? "bg-slate-900/20 border-slate-800/60" 
                                : "bg-slate-900/5 border-slate-800/20 opacity-85"
                        }`}
                      >
                        {isNext && (
                          <span className="absolute -top-2.5 -left-2 bg-emerald-600 text-white font-extrabold text-[8px] uppercase px-2 py-0.5 rounded-full border border-emerald-500 shadow">
                            ⏱️ Próximo Sorteo
                          </span>
                        )}

                        {/* Hora y Estado */}
                        <div className="flex items-center gap-3 w-full md:w-1/4 shrink-0">
                          <div className="text-center bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800 min-w-[84px]">
                            <span className="text-[12px] font-black font-mono block text-white">{item.hour}</span>
                            <span className="text-[7.5px] uppercase font-black text-slate-500 block tracking-wider leading-none">Sorteo</span>
                          </div>

                          <div className="space-y-1">
                            {hit ? (
                              <span className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-black px-2 py-0.5 rounded text-[9.5px] uppercase flex items-center gap-1 leading-none">
                                🏆 GANADO
                              </span>
                            ) : played ? (
                              <span className="bg-rose-500/15 border border-rose-500/40 text-rose-400 font-black px-2 py-0.5 rounded text-[9.5px] uppercase flex items-center gap-1 leading-none">
                                ❌ ARRASTRE
                              </span>
                            ) : (
                              <span className="bg-slate-500/15 border border-slate-500/40 text-slate-400 font-black px-2 py-0.5 rounded text-[9.5px] uppercase flex items-center gap-1 leading-none">
                                ⏳ PENDIENTE
                              </span>
                            )}
                            <span className="text-[8.5px] font-extrabold block text-slate-550 uppercase leading-none">
                              {item.formulaName.split(" (")[0]}
                            </span>
                          </div>
                        </div>

                        {/* Proyecciones Detalle */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:flex-grow">
                          {/* Bases */}
                          <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-slate-500 block leading-none font-sans">Bases:</span>
                            <div className="flex gap-1.5">
                              {item.baseCodes.map((code, idx) => {
                                const m = ANIMALITOS[code === "0" || code === "00" ? code : parseInt(code, 10).toString()];
                                return (
                                  <span key={`${code}-${idx}`} className="bg-slate-900/60 px-1.5 py-1 rounded text-[10.5px] font-mono border border-slate-800 flex items-center gap-1 font-bold text-slate-300">
                                    <span>{m?.emoji || "❓"}</span>
                                    <span>{code}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>

                          {/* Arrastre Previo */}
                          <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-slate-500 block leading-none font-sans">Arrastre previo:</span>
                            {item.preDrawArrastre.length === 0 ? (
                              <span className="text-[9.5px] italic text-slate-500 block py-0.5 font-sans">Limpio ✨</span>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {item.preDrawArrastre.map((code, idx) => (
                                  <span key={`${code}-${idx}`} className="bg-amber-950/20 border border-amber-500/20 text-amber-500 px-1 py-0.5 rounded text-[9.5px] font-mono font-bold">
                                    {code}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Jugada Sugerida */}
                          <div className="space-y-1">
                            <span className="text-[8px] font-black uppercase text-slate-500 block leading-none font-sans">Jugada Recomendada:</span>
                            <div className="flex flex-wrap gap-1">
                              {item.suggestedPlay.map((code, idx) => (
                                <span key={`${code}-${idx}`} className="bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 px-1 py-0.5 rounded text-[9.5px] font-mono font-extrabold">
                                  {code}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Resultado Real */}
                        <div className="w-full md:w-36 shrink-0 text-right flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end gap-1 pb-1 md:pb-0 border-t md:border-t-0 border-slate-800/30 pt-2 md:pt-0">
                          <span className="text-[8px] font-black uppercase text-slate-500 block md:hidden leading-none">Resultado Real:</span>
                          {played && item.realResult ? (() => {
                            const m = ANIMALITOS[item.realResult];
                            const wonDraw = item.suggestedPlay.includes(item.realResult);
                            return (
                              <div className={`p-1.5 px-3 rounded-xl border flex items-center gap-1.5 ${
                                wonDraw 
                                  ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/5 animate-pulse" 
                                  : "bg-slate-900 border-slate-800 text-slate-400"
                              }`}>
                                <span className="text-base select-none">{m?.emoji || "❓"}</span>
                                <div className="text-left font-sans">
                                  <span className="text-[10px] font-mono font-bold block leading-none">#{item.realResult}</span>
                                  <span className="text-[10px] font-black uppercase leading-none block">{m?.name || "Desc..."}</span>
                                </div>
                              </div>
                            );
                          })() : (
                            <span className="text-[10.5px] font-bold text-slate-550 italic uppercase bg-slate-900/40 px-2.5 py-1.5 rounded-xl border border-slate-800 border-dashed font-sans">
                              Pendiente ⏱️
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MODO MANUAL DE CÁLCULO INDIVIDUAL */
        <div className="grid grid-cols-12 gap-6 animate-fadeIn">
          {/* Columna Izquierda: Entradas Manuales */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <div className={`${cardTheme} p-6 flex flex-col gap-5 shadow-md flex-1`}>
              <div className="border-b border-slate-200/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-display leading-none">
                    <span>📝</span> ENTRADAS MANUALES DEL SORTEO
                  </h4>
                  <p className={`text-[11px] leading-relaxed mt-1 ${textMutedTheme}`}>
                    Selecciona el horario a calcular e ingresa los códigos de animales de manera manual para probar el simulador.
                  </p>
                </div>
              </div>

              {/* Selector de Horario para Manual */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-350 block mb-1">⏱️ Horario del Sorteo a Manualizar:</label>
                <select
                  value={sistemaxHour}
                  onChange={(e) => { playSound("click"); setSistemaxHour(e.target.value); }}
                  className={`w-full p-2.5 rounded-xl font-bold text-xs cursor-pointer select-none border ${
                    darkMode ? "bg-[#182033] border-slate-700/60 text-white" : "bg-white border-black text-black"
                  }`}
                >
                  {HOURS_LIST.map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              {/* Formulario de Inputs dependiente de la Fórmula */}
              <div className="space-y-4 flex-grow">
                {resolvedInputs.formulaType.type === "formula1" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Rojo 1 (ej. 07)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxRojo1}
                          onChange={(e) => setSistemaxRojo1(e.target.value.replace(/\D/g, ""))}
                          className={`p-3 rounded-xl font-bold font-mono text-center text-sm border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="07"
                        />
                        <div className="text-[10px] text-slate-400 text-center font-bold">
                          {(() => {
                            const c = sistemaxRojo1 === "0" || sistemaxRojo1 === "00" ? sistemaxRojo1 : parseInt(sistemaxRojo1 || "7", 10).toString();
                            return ANIMALITOS[c] ? `${ANIMALITOS[c].emoji} ${ANIMALITOS[c].name}` : "Desconocido";
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Rojo 2 (ej. 05)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxRojo2}
                          onChange={(e) => setSistemaxRojo2(e.target.value.replace(/\D/g, ""))}
                          className={`p-3 rounded-xl font-bold font-mono text-center text-sm border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="05"
                        />
                        <div className="text-[10px] text-slate-400 text-center font-bold">
                          {(() => {
                            const c = sistemaxRojo2 === "0" || sistemaxRojo2 === "00" ? sistemaxRojo2 : parseInt(sistemaxRojo2 || "5", 10).toString();
                            return ANIMALITOS[c] ? `${ANIMALITOS[c].emoji} ${ANIMALITOS[c].name}` : "Desconocido";
                          })()}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Par (ej. 22)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxPar}
                          onChange={(e) => setSistemaxPar(e.target.value.replace(/\D/g, ""))}
                          className={`p-3 rounded-xl font-bold font-mono text-center text-sm border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-blue-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="22"
                        />
                        <div className="text-[10px] text-slate-400 text-center font-bold">
                          {(() => {
                            const c = sistemaxPar === "0" || sistemaxPar === "00" ? sistemaxPar : parseInt(sistemaxPar || "22", 10).toString();
                            return ANIMALITOS[c] ? `${ANIMALITOS[c].emoji} ${ANIMALITOS[c].name}` : "Desconocido";
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {resolvedInputs.formulaType.type === "formula2" && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                      darkMode ? "bg-slate-900 border-slate-800" : "bg-slate-50 border-gray-200"
                    }`}>
                      <div className="flex flex-col gap-0.5 pr-2">
                        <span className="text-xs font-black uppercase text-slate-300">¿Salieron el 12 o 29 temprano?</span>
                        <span className={`text-[10.5px] ${textMutedTheme}`}>Marca SÍ si salieron Caballo (12) o Elefante (29) hoy.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                        <input
                          type="checkbox"
                          checked={sistemaxSalieronTemprano}
                          onChange={(e) => { playSound("click"); setSistemaxSalieronTemprano(e.target.checked); }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {!sistemaxSalieronTemprano ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-350 p-4 rounded-xl text-center flex flex-col gap-1.5 animate-fadeIn">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400">⚠️ ARRASTRE DIRECTO DETECTADO</span>
                        <p className="text-xs">
                          Al no haber salido Caballo (12) o Elefante (29) temprano, la regla indica un arrastre inmediato fijo. No necesitas inputs adicionales.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 animate-fadeIn">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Par Rojo (ej. 30)</span>
                          <input
                            type="text"
                            maxLength={2}
                            value={sistemaxParRojo}
                            onChange={(e) => setSistemaxParRojo(e.target.value.replace(/\D/g, ""))}
                            className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                              darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                            }`}
                            placeholder="30"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Impar Negro (ej. 31)</span>
                          <input
                            type="text"
                            maxLength={2}
                            value={sistemaxImparNegro}
                            onChange={(e) => setSistemaxImparNegro(e.target.value.replace(/\D/g, ""))}
                            className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                              darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-zinc-500" : "bg-white border-black text-black"
                            }`}
                            placeholder="31"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Otro Par Rojo 1 (ej. 32)</span>
                          <input
                            type="text"
                            maxLength={2}
                            value={sistemaxParRojo2}
                            onChange={(e) => setSistemaxParRojo2(e.target.value.replace(/\D/g, ""))}
                            className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                              darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                            }`}
                            placeholder="32"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Otro Par Rojo 2 (ej. 36)</span>
                          <input
                            type="text"
                            maxLength={2}
                            value={sistemaxParRojo3}
                            onChange={(e) => setSistemaxParRojo3(e.target.value.replace(/\D/g, ""))}
                            className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                              darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                            }`}
                            placeholder="36"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {resolvedInputs.formulaType.type === "formula3" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Impar Negro (ej. 29)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxImparNegro2}
                          onChange={(e) => setSistemaxImparNegro2(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-zinc-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="29"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Par Negro (ej. 26)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxParNegro}
                          onChange={(e) => setSistemaxParNegro(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-zinc-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="26"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Impar Rojo 1 (ej. 01)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxImparRojo1}
                          onChange={(e) => setSistemaxImparRojo1(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="01"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Impar Rojo 2 (ej. 25)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxImparRojo2}
                          onChange={(e) => setSistemaxImparRojo2(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="25"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {resolvedInputs.formulaType.type === "formula4" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Impar Negro (ej. 33)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxImparNegro3}
                          onChange={(e) => setSistemaxImparNegro3(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-zinc-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="33"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Impar Rojo 1 (ej. 09)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxImparRojo3}
                          onChange={(e) => setSistemaxImparRojo3(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="09"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-mono">Verde (ej. 0)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxParVerde}
                          onChange={(e) => setSistemaxParVerde(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-emerald-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="0"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">Últ Imp Rojo (ej. 27)</span>
                        <input
                          type="text"
                          maxLength={2}
                          value={sistemaxImparRojo4}
                          onChange={(e) => setSistemaxImparRojo4(e.target.value.replace(/\D/g, ""))}
                          className={`p-2.5 rounded-xl font-bold font-mono text-center text-xs border focus:outline-none transition-all ${
                            darkMode ? "bg-slate-900 border-slate-700 text-white focus:border-rose-500" : "bg-white border-black text-black"
                          }`}
                          placeholder="27"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón de Cálculo Manual */}
              <button
                type="button"
                onClick={handleCalculateSistemaX}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest py-3 px-4 rounded-xl transition-all cursor-pointer shadow flex items-center justify-center gap-2 mt-4"
              >
                <span>🚀</span> CALCULAR PROYECCIÓN MANUAL
              </button>
            </div>
          </div>

          {/* Columna Derecha: Vista Previa y Resultados de la Proyección Manual */}
          <div className="col-span-12 lg:col-span-6 flex flex-col gap-6">
            <div className={`${cardTheme} p-6 flex flex-col gap-5 shadow-md border border-slate-250/20`}>
              <div className="border-b border-slate-200/10 pb-3">
                <span className="bg-emerald-500/15 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider inline-block mb-1">
                  🎯 Proyección Calculada (Individual)
                </span>
                <h4 className="text-sm font-black uppercase text-slate-100 font-display leading-tight">
                  SORTEO: {sistemaxHour}
                </h4>
              </div>

              <div className="space-y-4">
                {activeProjection.alertMessage && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-350 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2">
                    <Sparkles size={16} className="shrink-0 text-emerald-400 animate-spin" />
                    <span>{activeProjection.alertMessage}</span>
                  </div>
                )}

                {/* Bases de la Proyección */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                    1. PROYECCIÓN BASE:
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    {activeProjection.results.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${
                        darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 shadow-sm"
                      }`}>
                        <span className="text-2xl filter drop-shadow">{item.emoji}</span>
                        <div>
                          <span className="text-[9px] font-mono font-bold text-zinc-500 block leading-none">#{item.code}</span>
                          <span className="text-xs font-black uppercase text-zinc-155 leading-none">{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Arrastre Actual */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 block">
                    2. ARRASTRE ESTIMADO PARA ESTE SORTEO ({activeProjection.arrastre.length}):
                  </span>
                  {activeProjection.arrastre.length === 0 ? (
                    <span className="text-[11px] italic text-slate-500 block py-1 bg-black/10 px-3 rounded-lg border border-dashed border-slate-800">
                      Sin arrastre. ¡La lista está limpia! ✨
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activeProjection.arrastre.map((code, idx) => {
                        const meta = ANIMALITOS[code === "0" || code === "00" ? code : parseInt(code, 10).toString()];
                        return (
                          <span key={idx} className="bg-amber-950/20 border border-amber-500/25 text-amber-500 px-2 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5">
                            <span>{meta?.emoji}</span>
                            <span>{code}</span>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Jugada Sugerida */}
                <div className="p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-450 block text-center font-bold">
                    👑 JUGADA RECOMENDADA (BASE + ARRASTRE):
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {activeProjection.jugadaFinal.map((code, idx) => {
                      const meta = ANIMALITOS[code === "0" || code === "00" ? code : parseInt(code, 10).toString()];
                      return (
                        <div key={`${code}-${idx}`} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all w-20 h-20 relative overflow-hidden ${
                          darkMode ? "bg-slate-950 border-emerald-500/30" : "bg-emerald-50 border-black shadow"
                        }`}>
                          <span className="absolute top-1 left-1.5 font-mono text-[8px] font-bold text-zinc-500">#{code}</span>
                          <span className="text-xl filter drop-shadow mb-0.5">{meta?.emoji || "❓"}</span>
                          <span className="text-[9px] font-black uppercase text-emerald-400 truncate max-w-full">{meta?.name || "Desconocido"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Explicación Matemática */}
                <div className={`p-3.5 rounded-xl border text-[11px] leading-relaxed font-mono ${
                  darkMode ? "bg-slate-950 border-slate-850 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
                }`}>
                  <strong className="text-emerald-400 uppercase block mb-1.5">Explicación del Algoritmo:</strong>
                  {activeProjection.formulaDesc}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Monitor de Resultados Calculados */}
      <div className={`${cardTheme} p-6 flex flex-col gap-4 shadow-md mt-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200/10 pb-3">
          <div>
            <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 font-display leading-none">
              <span>🖥️</span> MONITOR DE RESULTADOS CALCULADOS (REGISTROS MANUALES)
            </h4>
            <p className={`text-[11px] leading-relaxed mt-1 ${textMutedTheme}`}>
              Historial de las proyecciones que has ejecutado y grabado de forma manual.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearSistemaxLogs}
            disabled={sistemaxLogs.length === 0}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shrink-0 ${
              sistemaxLogs.length === 0
                ? "bg-slate-800 text-slate-600 border border-slate-850 cursor-not-allowed opacity-50"
                : "bg-rose-950/20 hover:bg-rose-900/30 text-rose-400 border border-rose-500/20 cursor-pointer"
            }`}
          >
            <Trash2 size={12} />
            <span>Limpiar Monitor</span>
          </button>
        </div>

        {sistemaxLogs.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-800/40 rounded-2xl">
            <span className="text-3xl block mb-2 opacity-60">📋</span>
            <span className="text-xs font-bold text-slate-500 block">El monitor está vacío</span>
            <span className="text-[10px] text-slate-600 block mt-0.5">Calcula una proyección para registrarla en esta lista</span>
          </div>
        ) : (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
            {sistemaxLogs.map((log) => (
              <div
                key={log.id}
                className={`p-4 rounded-xl border transition-all ${
                  darkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center border-b border-slate-800/20 pb-2.5 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-slate-800 text-white font-mono text-[9px] px-2 py-0.5 rounded font-extrabold">{log.time}</span>
                    <span className="bg-emerald-950/40 text-emerald-350 font-bold text-[9.5px] px-2 py-0.5 rounded border border-emerald-500/20 uppercase">{log.loteria}</span>
                    <span className="text-xs font-black text-slate-200">{log.selectedHour}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase">({log.formulaName})</span>
                  </div>

                  {log.auto ? (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/25">🧠 AUTO</span>
                  ) : (
                    <span className="text-[9px] font-black text-zinc-400 bg-zinc-500/10 px-2 py-0.5 rounded-full border border-zinc-500/25">✍️ MANUAL</span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex-1 space-y-2">
                    <p className="text-[10.5px] leading-relaxed text-slate-400 font-mono"><strong className="text-slate-300">Cálculo:</strong> {log.description}</p>
                    
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[9px] font-black text-slate-500 uppercase">Bases:</span>
                      <div className="flex gap-1.5">
                        {log.baseProjections.map((pObj: any, idx: number) => (
                          <span key={idx} className="bg-slate-950 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-300 border border-slate-850 flex items-center gap-1 font-bold">
                            <span>{pObj.emoji}</span>
                            <span>{pObj.code}</span>
                          </span>
                        ))}
                      </div>

                      <span className="text-[9px] font-black text-slate-500 uppercase ml-3">Arrastre:</span>
                      {log.arrastre.length === 0 ? (
                        <span className="text-[9px] italic text-slate-600">Limpio ✨</span>
                      ) : (
                        <div className="flex gap-1">
                          {log.arrastre.map((code: string, idx: number) => (
                            <span key={idx} className="bg-amber-950/10 border border-amber-500/20 text-amber-500 px-1 py-0.5 rounded font-mono text-[9.5px] font-bold">
                              {code}
                            </span>
                          ))}
                        </div>
                      )}

                      <span className="text-[9px] font-black text-slate-500 uppercase ml-3">Recomendado:</span>
                      <div className="flex gap-1">
                        {log.suggestedPlay.map((code: string, idx: number) => (
                          <span key={idx} className="bg-emerald-950/20 border border-emerald-500/25 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-[10px] font-extrabold">
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {log.alert && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-350 rounded px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1 h-fit self-end sm:self-center shrink-0">
                      <AlertTriangle size={12} />
                      <span>{log.alert}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

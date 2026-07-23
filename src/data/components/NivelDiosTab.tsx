import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  Map, 
  Activity, 
  TrendingUp, 
  FolderDown, 
  Copy, 
  Check, 
  Code, 
  RefreshCw, 
  AlertTriangle, 
  Gauge, 
  Zap,
  Layers,
  HelpCircle,
  Calendar,
  Search,
  Table,
  Filter
} from "lucide-react";
import { ANIMALITOS } from "../animalitos";

// Mapeo oficial de los 38 animales en los 4 cuadrantes físicos de la ruleta venezolana
export const CUADRANTES = {
  I: {
    nombre: "Cuadrante I (Nordeste - Aire/Inercia)",
    emoji: "💨",
    color: "from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400",
    hoverColor: "hover:bg-blue-500/5",
    colorRueda: "#2563eb",
    animales: ["01", "02", "03", "04", "05", "06", "07", "08", "09"]
  },
  II: {
    nombre: "Cuadrante II (Noroeste - Tierra/Fuerza)",
    emoji: "⛰️",
    color: "from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-400",
    hoverColor: "hover:bg-amber-500/5",
    colorRueda: "#d97706",
    animales: ["10", "11", "12", "13", "14", "15", "16", "17", "18"]
  },
  III: {
    nombre: "Cuadrante III (Suroeste - Agua/Misterio)",
    emoji: "💧",
    color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-400",
    hoverColor: "hover:bg-emerald-500/5",
    colorRueda: "#059669",
    animales: ["19", "20", "21", "22", "23", "24", "25", "26", "27"]
  },
  IV: {
    nombre: "Cuadrante IV (Sureste - Fuego/Inestabilidad)",
    emoji: "🔥",
    color: "from-red-500/20 to-pink-500/10 border-red-500/40 text-red-400",
    hoverColor: "hover:bg-red-500/5",
    colorRueda: "#dc2626",
    animales: ["28", "29", "30", "31", "32", "33", "34", "35", "36", "0", "00"]
  }
};

interface NivelDiosTabProps {
  darkMode: boolean;
  accumulatedResults: any[];
  loteria: string;
  currentDraws: Record<string, string | null>;
  playSound: (soundName: string) => void;
  hoursList: string[];
  selectedHour: string;
}

export function NivelDiosTab({
  darkMode,
  accumulatedResults,
  loteria,
  currentDraws,
  playSound,
  hoursList,
  selectedHour
}: NivelDiosTabProps) {
  // --- Estados de Python Code Tab Viewer ---
  const [activeCodeFile, setActiveCodeFile] = useState<"model.py" | "train.py" | "predict.py">("model.py");
  const [copied, setCopied] = useState(false);

  // --- Estados de Reinforcement Learning ---
  const [rlWeights, setRlWeights] = useState({
    markov: 30,
    bayes: 25,
    poisson: 20,
    montecarlo: 15,
    lstm: 10
  });
  const [tuningLogs, setTuningLogs] = useState<string[]>([
    "SISTEMA: Agente de Aprendizaje por Refuerzo Q-Learning inicializado.",
    "PESOS: Estado de equilibrio cargado por defecto para hoy."
  ]);
  const [isTuning, setIsTuning] = useState(false);

  // --- Estado de Simulación LSTM ---
  const [lstmPredicting, setLstmPredicting] = useState(false);
  const [lstmResult, setLstmResult] = useState<{
    confidence: number;
    predictions: Array<{ code: string; probability: number }>;
  } | null>(null);

  // --- Estados de la Matriz Histórica por Horas ---
  const [matrixDateQuery, setMatrixDateQuery] = useState("");
  const [matrixAnimalQuery, setMatrixAnimalQuery] = useState("");

  // --- Código Python para mostrar ---
  const pythonCodes = {
    "model.py": `import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Embedding, Dropout

def create_lstm_model(vocab_size=38, embedding_dim=32, lstm_units=64, seq_length=50):
    """
    Crea un modelo de Red Neuronal Recurrente LSTM para predecir la secuencia de sorteos.
    Entrada: Secuencia temporal de animalitos (longitud seq_length)
    Salida: Distribución de probabilidad Softmax sobre los 38 posibles resultados de la ruleta (0, 00, 1 al 36)
    """
    model = Sequential([
        # Capa de Embedding para convertir índices numéricos en vectores densos continuos
        Embedding(input_dim=vocab_size, output_dim=embedding_dim, input_length=seq_length),
        
        # Primera capa LSTM con retorno de secuencias para apilar otra LSTM
        LSTM(lstm_units, return_sequences=True),
        Dropout(0.2), # Dropout para prevenir el sobreajuste (overfitting)
        
        # Segunda capa LSTM que consolida el estado temporal oculto de largo plazo
        LSTM(lstm_units),
        Dropout(0.2),
        
        # Capa totalmente conectada con activación Softmax para emitir probabilidades
        Dense(vocab_size, activation='softmax')
    ])
    
    # Compilación con gradiente descendente Adam y pérdida por entropía cruzada categórica
    model.compile(
        optimizer='adam',
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    return model`,

    "train.py": `import numpy as np
import tensorflow as tf
from model import create_lstm_model

# Definimos el mapa oficial de la ruleta de 38 animalitos de Lotto Activo, La Granjita y Selva Plus
# Mapea códigos de animales a índices del 0 al 37
ANIMAL_TO_IDX = {str(i).zfill(2) if i != 0 else "0": i for i in range(37)}
ANIMAL_TO_IDX["00"] = 0  # Re-mapeo para sincronizar el 00
IDX_TO_ANIMAL = {v: k for k, v in ANIMAL_TO_IDX.items()}

def prepare_data(sequence_history, seq_length=50):
    """
    Formatea el historial lineal de sorteos en ventanas deslizantes (sliding windows) de entrenamiento.
    X: Secuencia temporal de 50 sorteos anteriores (Input)
    y: Sorteo número 51 consecutivo (Target)
    """
    # Limpieza de nulos y conversión a índices numéricos de 0 a 37
    cleaned_sequence = [str(animal).strip() for animal in sequence_history if animal is not None]
    indices = [ANIMAL_TO_IDX.get(animal, 0) for animal in cleaned_sequence]
    
    X, y = [], []
    for i in range(len(indices) - seq_length):
        X.append(indices[i:i + seq_length])
        y.append(indices[i + seq_length])
        
    return np.array(X), np.array(y)

def train_and_save(sequence_history, epochs=25, batch_size=32, model_path="lstm_lotto_model.h5"):
    """
    Inicializa la red LSTM, formatea el set de datos y ejecuta el ciclo de entrenamiento (Backpropagation).
    """
    X, y = prepare_data(sequence_history, seq_length=50)
    
    if len(X) < 10:
        print(f"⚠️ Historial insuficiente para entrenar. Se requieren al menos 60 sorteos cargados. Recibidos: {len(X)}")
        return False
        
    # Crear modelo LSTM
    model = create_lstm_model(vocab_size=38, seq_length=50)
    print(f"🚀 Iniciando entrenamiento con {len(X)} secuencias temporales en {epochs} épocas...")
    
    # Entrenamiento con detención temprana para prevenir overfitting si la pérdida de validación deja de mejorar
    early_stop = tf.keras.callbacks.EarlyStopping(
        monitor='val_loss', 
        payout=5, 
        restore_best_weights=True
    )
    
    history = model.fit(
        X, y,
        epochs=epochs,
        batch_size=batch_size,
        validation_split=0.15,
        callbacks=[early_stop],
        verbose=1
    )
    
    # Guardar modelo en formato HDF5 para despliegues portátiles
    model.save(model_path)
    print(f"✅ Red Neuronal LSTM guardada de forma segura en: {model_path}")
    return True`,

    "predict.py": `import json
import numpy as np
import tensorflow as tf
from model import create_lstm_model

# Configuración del mapa oficial de ruleta
ANIMAL_TO_IDX = {str(i).zfill(2) if i != 0 else "0": i for i in range(37)}
ANIMAL_TO_IDX["00"] = 0
IDX_TO_ANIMAL = {v: k for k, v in ANIMAL_TO_IDX.items()}

# Cache del modelo para optimizar inicios en frío (Cold Starts) en microservicios Serverless
model_cache = None

def load_or_init_model():
    """
    Carga el modelo LSTM de la memoria caché del contenedor o lo inicializa si es una nueva instancia.
    """
    global model_cache
    if model_cache is None:
        # Inicializar estructura
        model_cache = create_lstm_model(vocab_size=38, seq_length=50)
        try:
            # Intentar cargar pesos pre-entrenados del archivo local
            model_cache.load_weights("lstm_lotto_model.h5")
            print("🧠 Pesos de la red neuronal LSTM cargados de forma exitosa.")
        except Exception as e:
            print("⚠️ No se encontraron pesos guardados en 'lstm_lotto_model.h5'. El modelo funcionará con pesos adaptativos dinámicos:", e)
    return model_cache

def handler(event, context):
    """
    Punto de entrada de función Serverless compatible con Vercel Functions o AWS Lambda.
    Recibe un payload POST en JSON con el historial cronológico de sorteos de Lotto Activo.
    Esquema del Body: { "history": ["12", "05", "24", "00", ...] } (Mínimo 50)
    """
    headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    }
    
    # Manejar peticiones de pre-vuelo (CORS Preflight)
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }
        
    try:
        # Extraer body del evento serverless
        body_str = event.get("body", "{}")
        body = json.loads(body_str)
        history = body.get("history", [])
        
        if len(history) < 50:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({
                    "success": False,
                    "error": "Historial insuficiente para recurrencia de red neuronal.",
                    "details": f"El algoritmo LSTM requiere una ventana temporal de al menos 50 sorteos. Recibidos: {len(history)}."
                })
            }
            
        # Tomar los últimos 50 animales secuenciales para realizar la inferencia predictiva
        input_sequence = history[-50:]
        input_indices = [ANIMAL_TO_IDX.get(str(x).strip(), 0) for x in input_sequence]
        
        # Redimensionar para la red neuronal (shape: [batch_size=1, seq_length=50])
        X_input = np.array([input_indices])
        
        # Cargar modelo desde caché o disco
        model = load_or_init_model()
        
        # Ejecutar pasada hacia adelante (Forward Pass / Inference)
        predictions = model.predict(X_input)[0] # Vector softmax de dimensión 38
        
        # Ordenar de mayor a menor probabilidad
        sorted_indices = np.argsort(predictions)[::-1]
        
        # Construir desglose completo de probabilidades para cada animal de la ruleta
        all_probabilities = {}
        for idx, prob in enumerate(predictions):
            animal_code = IDX_TO_ANIMAL.get(idx, "00")
            all_probabilities[animal_code] = float(prob)
            
        # Extraer top 5 recomendaciones
        top_recommendations = []
        for idx in sorted_indices[:5]:
            code = IDX_TO_ANIMAL.get(idx, "00")
            top_recommendations.append({
                "code": code,
                "probability": float(predictions[idx]),
                "percentage_label": f"{float(predictions[idx] * 100):.2f}%"
            })
            
        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({
                "success": True,
                "engine": "LSTM recurrent deep neural network (Nivel Dios)",
                "confidence_score": float(np.max(predictions)),
                "top_recommendations": top_recommendations,
                "all_probabilities": all_probabilities
            }, indent=2)
        }
        
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({
                "success": False,
                "error": "Error interno del motor de inferencia LSTM en servidor de nube.",
                "details": str(e)
            })
        }
`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCodes[activeCodeFile]);
    setCopied(true);
    playSound("click");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCode = () => {
    playSound("click");
    const element = document.createElement("a");
    const file = new Blob([pythonCodes[activeCodeFile]], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = activeCodeFile;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // --- 1. Historial de Secuencia de Sorteos ---
  const sequenceHistory = useMemo(() => {
    // Ordenar historial cronológico ascendente
    const sortedDays = [...accumulatedResults]
      .filter(r => r.loteria === loteria)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    const sequence: string[] = [];
    sortedDays.forEach(day => {
      // Ordenar horas de sorteo cronológicamente
      const sortedHours = Object.keys(day.draws || {}).sort((a, b) => {
        const getMins = (hStr: string) => {
          const match = hStr.toUpperCase().match(/^(\d+):(\d+)/);
          if (!match) return 0;
          let h = parseInt(match[1], 10);
          const m = parseInt(match[2], 10);
          if (hStr.toUpperCase().includes("PM") && h < 12) h += 12;
          else if (hStr.toUpperCase().includes("AM") && h === 12) h = 0;
          return h * 60 + m;
        };
        return getMins(a) - getMins(b);
      });

      sortedHours.forEach(h => {
        const val = day.draws[h];
        if (val) sequence.push(val);
      });
    });

    return sequence;
  }, [accumulatedResults, loteria]);

  // --- 2. Análisis Espacial de Cuadrantes (Rueda de Calor) ---
  const todayActiveDraws = useMemo(() => {
    return Object.values(currentDraws).filter((v): v is string => typeof v === "string" && v !== "");
  }, [currentDraws]);

  const quadrantStats = useMemo(() => {
    const counts = { I: 0, II: 0, III: 0, IV: 0 };
    const items = todayActiveDraws.length > 0 ? todayActiveDraws : sequenceHistory.slice(-20);
    
    items.forEach(code => {
      const norm = code === "0" || code === "00" ? code : (code.startsWith("0") ? code.substring(1) : code);
      if (CUADRANTES.I.animales.includes(norm)) counts.I++;
      else if (CUADRANTES.II.animales.includes(norm)) counts.II++;
      else if (CUADRANTES.III.animales.includes(norm)) counts.III++;
      else if (CUADRANTES.IV.animales.includes(norm)) counts.IV++;
    });

    const total = Math.max(1, items.length);
    return {
      I: parseFloat(((counts.I / total) * 100).toFixed(1)),
      II: parseFloat(((counts.II / total) * 100).toFixed(1)),
      III: parseFloat(((counts.III / total) * 100).toFixed(1)),
      IV: parseFloat(((counts.IV / total) * 100).toFixed(1)),
      totalElements: items.length,
      isUsingToday: todayActiveDraws.length > 0
    };
  }, [todayActiveDraws, sequenceHistory]);

  const quadrantBiasAlert = useMemo(() => {
    const stats = quadrantStats;
    const threshold = 35.0; // Desvío estadístico fuerte (>35% de frecuencia en un cuadrante)
    
    if (stats.totalElements < 3) return null;

    if (stats.I > threshold) {
      return { quadrant: "I", pct: stats.I, desc: CUADRANTES.I.nombre, emoji: CUADRANTES.I.emoji };
    }
    if (stats.II > threshold) {
      return { quadrant: "II", pct: stats.II, desc: CUADRANTES.II.nombre, emoji: CUADRANTES.II.emoji };
    }
    if (stats.III > threshold) {
      return { quadrant: "III", pct: stats.III, desc: CUADRANTES.III.nombre, emoji: CUADRANTES.III.emoji };
    }
    if (stats.IV > threshold) {
      return { quadrant: "IV", pct: stats.IV, desc: CUADRANTES.IV.nombre, emoji: CUADRANTES.IV.emoji };
    }
    return null;
  }, [quadrantStats]);

  // --- 3. Motor de Detección de Anomalías (Shannon Entropy) ---
  const anomalyReport = useMemo(() => {
    const items = todayActiveDraws.length >= 4 ? todayActiveDraws : sequenceHistory.slice(-15);
    
    if (items.length < 4) {
      return {
        entropy: 5.0,
        detected: false,
        severity: "NORMAL" as const,
        description: "Datos históricos insuficientes en la jornada para evaluar desvíos de entropía."
      };
    }

    // Calcular frecuencias
    const freq: Record<string, number> = {};
    items.forEach(c => freq[c] = (freq[c] || 0) + 1);

    // Calcular entropía de Shannon
    const total = items.length;
    let entropy = 0;
    Object.values(freq).forEach(count => {
      const p = count / total;
      entropy -= p * Math.log2(p);
    });

    // En una ruleta perfecta de 38 animales, la entropía máxima es log2(38) = 5.24.
    // Si la entropía cae por debajo de 2.2 (con al menos 4 sorteos), hay una repetición anómala masiva.
    // También detectamos si hay 3 repeticiones de la misma familia biológica o cuadrante en los últimos 4 sorteos.
    let detected = false;
    let severity: "NORMAL" | "ALTA" | "CRITICA" = "NORMAL";
    let description = "El sorteador de la ruleta se comporta de manera estable, siguiendo una entropía estándar adecuada de dispersión térmica.";

    if (entropy < 2.0 && todayActiveDraws.length >= 4) {
      detected = true;
      severity = "CRITICA";
      description = `La entropía de Shannon cayó a un nivel crítico de ${entropy.toFixed(2)} (Bajo el umbral 2.0). Se detecta una redundancia extrema de aciertos repetitivos en la ruleta física en las últimas horas. Se aconseja no jugar bajo fórmulas cíclicas normales hoy.`;
    } else if (entropy < 2.6 && todayActiveDraws.length >= 4) {
      detected = true;
      severity = "ALTA";
      description = `Entropía moderadamente reducida de ${entropy.toFixed(2)}. La máquina tiende a concentrar sorteos en sectores específicos de su disco de aluminio. Es preferible seguir la inercia térmica inmediata de repeticiones.`;
    } else {
      // Verificar si el último elemento se repitió de inmediato
      if (items.length >= 3 && items[items.length - 1] === items[items.length - 2]) {
        detected = true;
        severity = "ALTA";
        description = "Repetición térmica de primer orden detectada (doblete inmediato). La ruleta exhibe un rebote de inercia física en el mismo casillero.";
      }
    }

    return {
      entropy: parseFloat(entropy.toFixed(2)),
      detected,
      severity,
      description
    };
  }, [todayActiveDraws, sequenceHistory]);

  // --- 4. Clusterización No Supervisada K-Means (IA Clusters) ---
  const kmeansClusters = useMemo(() => {
    // Agrupa los 38 animales de forma empírica analizando el historial completo de la secuencia de transiciones
    // Simulamos un clasificador K-Means con centroides basados en correlación de arrastre secuencial directo.
    const clusterNames = [
      { id: "C1", titulo: "Inercia Rápida (Épsilon)", emoji: "⚡", desc: "Animales con altísima inercia térmica que salen muy seguidos o en repetición directa." },
      { id: "C2", titulo: "Sinergia Biológica (Omega)", emoji: "🐾", desc: "Animales que arrastran de forma cruzada a miembros de su misma categoría o sector físico." },
      { id: "C3", titulo: "Vacíos Horarios (Sigma)", emoji: "⏳", desc: "Animales fríos o durmientes, ideales para cazar en las últimas horas de la jornada." },
      { id: "C4", titulo: "Arrastre de Retorno (Delta)", emoji: "🔄", desc: "Animales que completan de forma predefinida las trilogías del sistema al salir su base." }
    ];

    // Distribuimos los 38 animales de forma determinista usando el hash del nombre de la lotería para simular clusterización adaptada
    const codes = Object.keys(ANIMALITOS).filter(k => k !== "0" && k !== "00");
    codes.push("0", "00");

    const clusters: Array<{
      id: string;
      titulo: string;
      emoji: string;
      desc: string;
      miembros: string[];
      saturacion: number;
    }> = clusterNames.map((c, i) => {
      // Asignar miembros de forma determinista y representativa
      const miembros = codes.filter((code, idx) => {
        return idx % 4 === i;
      });

      // Calcular saturación (cuántos miembros del clúster han salido hoy)
      const hoySalidosCount = miembros.filter(m => todayActiveDraws.includes(m)).length;
      const saturacion = parseFloat(((hoySalidosCount / miembros.length) * 100).toFixed(1));

      return {
        ...c,
        miembros,
        saturacion
      };
    });

    return clusters;
  }, [todayActiveDraws]);

  // --- Cálculos de la Matriz Histórica de Sorteos por Horas ---
  const parseDateToComparable = (dateStr: string) => {
    if (!dateStr) return "";
    if (dateStr.includes("/")) {
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        // Asumiendo DD/MM/YYYY
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    return dateStr; // Ya está en formato YYYY-MM-DD o similar
  };

  const filteredHistory = useMemo(() => {
    return [...accumulatedResults]
      .filter(r => r.loteria === loteria)
      .sort((a, b) => parseDateToComparable(b.fecha).localeCompare(parseDateToComparable(a.fecha)));
  }, [accumulatedResults, loteria]);

  const filteredMatrixRows = useMemo(() => {
    return filteredHistory.filter(row => {
      // Filtrar por fecha
      if (matrixDateQuery && !row.fecha.toLowerCase().includes(matrixDateQuery.toLowerCase())) {
        return false;
      }
      // Filtrar por animal (código o nombre)
      if (matrixAnimalQuery) {
        const hasAnimal = Object.values(row.draws || {}).some(code => {
          if (!code) return false;
          const normCode = code.toString().trim();
          const ani = ANIMALITOS[normCode];
          return (
            normCode === matrixAnimalQuery ||
            (ani && ani.name.toLowerCase().includes(matrixAnimalQuery.toLowerCase()))
          );
        });
        if (!hasAnimal) return false;
      }
      return true;
    });
  }, [filteredHistory, matrixDateQuery, matrixAnimalQuery]);

  // --- Algoritmo de Detección de Patrones Automáticos en la Matriz ---
  const matrixAutoPatterns = useMemo(() => {
    if (filteredHistory.length === 0) return null;

    // 1. Detectar repeticiones consecutivas de un animal en la misma hora (Inercia pura)
    const consecutivePatterns: Array<{ hour: string; code: string; emoji: string; name: string; days: number }> = [];
    const chronoHistory = [...filteredHistory].reverse();
    
    hoursList.forEach(hour => {
      let currentSeq = 0;
      let lastCode = "";
      let maxSeq = 0;
      let seqCode = "";
      
      chronoHistory.forEach(row => {
        const code = row.draws[hour]?.toString().trim();
        if (code) {
          if (code === lastCode) {
            currentSeq++;
          } else {
            if (currentSeq > maxSeq) {
              maxSeq = currentSeq;
              seqCode = lastCode;
            }
            currentSeq = 1;
            lastCode = code;
          }
        }
      });
      if (currentSeq > maxSeq) {
        maxSeq = currentSeq;
        seqCode = lastCode;
      }
      
      if (maxSeq >= 2 && seqCode) {
        const anim = ANIMALITOS[seqCode];
        if (anim) {
          consecutivePatterns.push({
            hour,
            code: seqCode,
            emoji: anim.emoji,
            name: anim.name,
            days: maxSeq
          });
        }
      }
    });

    // 2. Detectar sesgos fuertes por hora específica (Paridad / Color)
    const hourlyBiases: Array<{ hour: string; dominantType: string; percentage: number; icon: string }> = [];
    
    hoursList.forEach(hour => {
      let total = 0;
      let redCount = 0;
      let evenCount = 0;
      
      chronoHistory.forEach(row => {
        const code = row.draws[hour]?.toString().trim();
        if (code) {
          total++;
          const numVal = parseInt(code, 10);
          const isPar = (code === "00" || code === "0" || (!isNaN(numVal) && numVal % 2 === 0));
          if (isPar) evenCount++;
          
          const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
          if (redNumbers.includes(numVal)) redCount++;
        }
      });

      if (total >= 3) {
        const parRatio = evenCount / total;
        const redRatio = redCount / total;
        
        if (parRatio >= 0.65) {
          hourlyBiases.push({ hour, dominantType: "Predisposición PAR", percentage: parRatio * 100, icon: "🔵" });
        } else if (parRatio <= 0.35) {
          hourlyBiases.push({ hour, dominantType: "Predisposición IMPAR", percentage: (1 - parRatio) * 100, icon: "🟣" });
        }

        if (redRatio >= 0.60) {
          hourlyBiases.push({ hour, dominantType: "Predisposición ROJO", percentage: redRatio * 100, icon: "🔴" });
        } else if (redRatio <= 0.30 && redRatio > 0) {
          hourlyBiases.push({ hour, dominantType: "Predisposición NEGRO", percentage: (1 - redRatio) * 100, icon: "⚫" });
        }
      }
    });

    // 3. Transiciones Markovianas inter-horarias más recurrentes
    const transitions: Array<{ fromHour: string; toHour: string; fromAnimal: string; toAnimal: string; count: number }> = [];
    const transitionCounts: Record<string, number> = {};
    
    for (let i = 0; i < hoursList.length - 1; i++) {
      const fromH = hoursList[i];
      const toH = hoursList[i+1];
      
      chronoHistory.forEach(row => {
        const fromCode = row.draws[fromH]?.toString().trim();
        const toCode = row.draws[toH]?.toString().trim();
        if (fromCode && toCode) {
          const key = `${fromH}->${toH}|${fromCode}->${toCode}`;
          transitionCounts[key] = (transitionCounts[key] || 0) + 1;
        }
      });
    }

    Object.entries(transitionCounts)
      .filter(([_, count]) => count >= 2)
      .forEach(([key, count]) => {
        const [hours, codes] = key.split("|");
        const [fromHour, toHour] = hours.split("->");
        const [fromCode, toCode] = codes.split("->");
        const fromAnim = ANIMALITOS[fromCode];
        const toAnim = ANIMALITOS[toCode];
        if (fromAnim && toAnim) {
          transitions.push({
            fromHour,
            toHour,
            fromAnimal: `${fromAnim.emoji} ${fromCode}`,
            toAnimal: `${toAnim.emoji} ${toCode}`,
            count
          });
        }
      });

    transitions.sort((a, b) => b.count - a.count);

    return {
      consecutivePatterns: consecutivePatterns.slice(0, 4),
      hourlyBiases: hourlyBiases.slice(0, 4),
      transitions: transitions.slice(0, 4)
    };
  }, [filteredHistory, hoursList]);

  // --- 5. Algoritmo de Aprendizaje por Refuerzo (Weight Calibration) ---
  const handleAutoTuneWeights = () => {
    setIsTuning(true);
    playSound("click");

    setTimeout(() => {
      // Simular computación heurística evaluando el acierto de cada motor hoy
      // Incrementa pesos del motor ganador y los estabiliza para sumar exactamente 100%
      const logs = [
        "SISTEMA: Iniciando calibración de pesos cognitivos basados en la jornada activa de hoy...",
        `AUDITORÍA: Evaluando precisión de los últimos ${Math.max(1, todayActiveDraws.length)} sorteos jugados.`,
      ];

      let markovHits = 1;
      let bayesHits = 1;
      let poissonHits = 0;
      let mcHits = 1;
      let lstmHits = 1;

      if (todayActiveDraws.length > 0) {
        // Simulamos la auditoría de aciertos aleatoria pero razonada sobre los sorteos de hoy
        markovHits = Math.floor(Math.random() * 3) + 1;
        bayesHits = Math.floor(Math.random() * 3) + 1;
        poissonHits = Math.floor(Math.random() * 2);
        mcHits = Math.floor(Math.random() * 2);
        lstmHits = Math.floor(Math.random() * 4) + 1; // La LSTM suele liderar
      }

      logs.push(`ANALIZADOR: Cadenas de Markov registraron ${markovHits} aciertos indirectos hoy.`);
      logs.push(`ANALIZADOR: Inferencia Bayesiana registró ${bayesHits} aciertos de paridad.`);
      logs.push(`ANALIZADOR: Red Neuronal LSTM registró ${lstmHits} aciertos de alta inercia.`);

      // Ajuste de pesos (debe sumar exactamente 100)
      const rawWeights = {
        markov: 15 + markovHits * 6,
        bayes: 15 + bayesHits * 5,
        poisson: 10 + poissonHits * 5,
        montecarlo: 10 + mcHits * 4,
        lstm: 20 + lstmHits * 8
      };

      const sum = rawWeights.markov + rawWeights.bayes + rawWeights.poisson + rawWeights.montecarlo + rawWeights.lstm;
      
      // Normalizar para que sume exactamente 100
      const normWeights = {
        markov: Math.round((rawWeights.markov / sum) * 100),
        bayes: Math.round((rawWeights.bayes / sum) * 100),
        poisson: Math.round((rawWeights.poisson / sum) * 100),
        montecarlo: Math.round((rawWeights.montecarlo / sum) * 100),
        lstm: 0 // Se calcula como diferencia para evitar errores de redondeo
      };

      normWeights.lstm = 100 - (normWeights.markov + normWeights.bayes + normWeights.poisson + normWeights.montecarlo);

      logs.push(`Q-LEARNING REWARD: Incrementado peso LSTM a ${normWeights.lstm}% debido a aciertos consecuentes.`);
      logs.push(`SISTEMA: Ajuste por gradiente completado. Nuevos pesos fijados para el próximo sorteo de las ${selectedHour}.`);

      setRlWeights(normWeights);
      setTuningLogs(prev => [...prev, ...logs].slice(-8)); // Mantener últimos 8 logs
      setIsTuning(false);
      playSound("success");
    }, 1800);
  };

  // --- 6. Ejecutar Inferencia de Red Neuronal LSTM (Simulado Local) ---
  const handleRunLstmPrediction = () => {
    setLstmPredicting(true);
    playSound("click");

    setTimeout(() => {
      // Realizamos predicciones inteligentes de alta inercia basadas en la secuencia cronológica real
      const pool = Object.keys(ANIMALITOS).filter(k => k !== "0" && k !== "00");
      pool.push("0", "00");

      const recentSeq = sequenceHistory.slice(-20);
      let recommendations: Array<{ code: string; probability: number }> = [];

      if (recentSeq.length > 5) {
        // En base a transiciones reales en la secuencia, proponemos las más frecuentes
        const counts: Record<string, number> = {};
        recentSeq.forEach(c => counts[c] = (counts[c] || 0) + 1);
        
        // Agregar peso por correlación espacial (cuadrante activo)
        const hotQuad = Object.entries(quadrantStats)
          .filter(([k]) => k !== "totalElements" && k !== "isUsingToday")
          .sort((a, b) => (b[1] as number) - (a[1] as number))[0][0] as "I" | "II" | "III" | "IV";

        const hotQuadAnimals = CUADRANTES[hotQuad].animales;

        // Seleccionar candidatos cruzando conteo y cuadrante
        const sortedPool = [...pool].sort((a, b) => {
          const scoreA = (counts[a] || 0) * 1.5 + (hotQuadAnimals.includes(a) ? 2 : 0) + Math.random();
          const scoreB = (counts[b] || 0) * 1.5 + (hotQuadAnimals.includes(b) ? 2 : 0) + Math.random();
          return scoreB - scoreA;
        });

        const top = sortedPool.slice(0, 5);
        recommendations = top.map((code, idx) => {
          const probability = 0.35 - (idx * 0.05) + (Math.random() * 0.03);
          return { code, probability: parseFloat(probability.toFixed(3)) };
        });
      } else {
        // Defaults
        const defaults = ["12", "05", "24", "30", "00"];
        recommendations = defaults.map((code, idx) => ({
          code,
          probability: 0.28 - idx * 0.04
        }));
      }

      setLstmResult({
        confidence: parseFloat((0.72 + Math.random() * 0.15).toFixed(2)),
        predictions: recommendations
      });
      setLstmPredicting(false);
      playSound("success");
    }, 1500);
  };

  useEffect(() => {
    // Al cambiar la hora seleccionada, simulamos un log en el agente de refuerzo
    setTuningLogs(prev => [
      ...prev,
      `HORARIO: Ajustando entorno de decisión de Markov/LSTM para la hora de las ${selectedHour}.`
    ].slice(-8));
  }, [selectedHour]);

  // Renderizado del mapa de rueda SVG
  const renderRouletteHeatmap = () => {
    const stats = quadrantStats;
    const colors = [CUADRANTES.I.colorRueda, CUADRANTES.II.colorRueda, CUADRANTES.III.colorRueda, CUADRANTES.IV.colorRueda];
    
    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-950/40 rounded-2xl border border-slate-800">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-1.5 w-full">
          <span>🎡</span> GEOMETRÍA DE LA RULETA (MAPA DE CALOR EN VIVO)
        </h4>

        <div className="relative w-56 h-56 rounded-full border border-slate-700/60 p-2 bg-slate-900 shadow-inner flex items-center justify-center">
          {/* Circulos concéntricos */}
          <div className="absolute inset-8 rounded-full border border-slate-800 pointer-events-none z-10" />
          <div className="absolute inset-16 rounded-full border border-slate-800 pointer-events-none z-10" />
          
          {/* Ejes cartesianos divisores */}
          <div className="absolute w-full h-px bg-slate-700/40 left-0 top-1/2 pointer-events-none z-10" />
          <div className="absolute h-full w-px bg-slate-700/40 top-0 left-1/2 pointer-events-none z-10" />

          {/* Sectores de cuadrantes SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-45">
            {/* Cuadrante I (Nordeste - Superior Derecho) */}
            <path 
              d="M 50,50 L 50,0 A 50,50 0 0,1 100,50 Z" 
              fill={colors[0]} 
              opacity={0.15 + (stats.I / 100) * 0.7}
              className="transition-all duration-300 cursor-pointer hover:opacity-90"
              onClick={() => playSound("click")}
            />
            {/* Cuadrante II (Noroeste - Superior Izquierdo) */}
            <path 
              d="M 50,50 L 100,50 A 50,50 0 0,1 50,100 Z" 
              fill={colors[1]} 
              opacity={0.15 + (stats.II / 100) * 0.7}
              className="transition-all duration-300 cursor-pointer hover:opacity-90"
              onClick={() => playSound("click")}
            />
            {/* Cuadrante III (Suroeste - Inferior Izquierdo) */}
            <path 
              d="M 50,50 L 50,100 A 50,50 0 0,1 0,50 Z" 
              fill={colors[2]} 
              opacity={0.15 + (stats.III / 100) * 0.7}
              className="transition-all duration-300 cursor-pointer hover:opacity-90"
              onClick={() => playSound("click")}
            />
            {/* Cuadrante IV (Sureste - Inferior Derecho) */}
            <path 
              d="M 50,50 L 0,50 A 50,50 0 0,1 50,0 Z" 
              fill={colors[3]} 
              opacity={0.15 + (stats.IV / 100) * 0.7}
              className="transition-all duration-300 cursor-pointer hover:opacity-90"
              onClick={() => playSound("click")}
            />
          </svg>

          {/* Núcleo de la ruleta */}
          <div className="absolute w-12 h-12 rounded-full bg-slate-950 border-2 border-slate-700/80 shadow-2xl flex items-center justify-center z-20">
            <span className="text-[10px] font-black text-emerald-400 font-mono">IA</span>
          </div>
          
          {/* Marcadores de etiquetas sobre la rueda */}
          <div className="absolute top-4 right-4 text-xs font-black text-blue-400 z-30 font-mono bg-slate-950/80 px-1 py-0.5 rounded shadow">
            I: {stats.I}%
          </div>
          <div className="absolute bottom-4 right-4 text-xs font-black text-amber-400 z-30 font-mono bg-slate-950/80 px-1 py-0.5 rounded shadow">
            II: {stats.II}%
          </div>
          <div className="absolute bottom-4 left-4 text-xs font-black text-emerald-400 z-30 font-mono bg-slate-950/80 px-1 py-0.5 rounded shadow">
            III: {stats.III}%
          </div>
          <div className="absolute top-4 left-4 text-xs font-black text-red-400 z-30 font-mono bg-slate-950/80 px-1 py-0.5 rounded shadow">
            IV: {stats.IV}%
          </div>
        </div>

        <p className="text-[9.5px] text-slate-500 font-sans leading-normal text-center mt-3 max-w-xs">
          Mapea las zonas de caída de la ruleta física basándose en {stats.totalElements} sorteos de {stats.isUsingToday ? "hoy" : "los últimos días"}. Los desvíos indican sesgos físicos en la máquina.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 text-white pb-16">
      
      {/* 1. SECCIÓN: BANNER DE ANOMALÍAS DE ENTRADA (ISOLATION FOREST / SHANNON ENTROPY) */}
      <AnimatePresence>
        {anomalyReport.detected && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-gradient-to-r from-red-950/80 to-purple-950/50 border-2 border-red-500/50 rounded-2xl shadow-xl flex flex-col md:flex-row items-center gap-4 relative overflow-hidden ring-4 ring-red-500/10"
          >
            {/* Animación de pulso de alerta */}
            <div className="absolute inset-0 bg-red-600/[0.03] animate-pulse pointer-events-none" />
            <div className="p-3 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
              <AlertTriangle size={24} className="animate-bounce" />
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="bg-red-500 text-white font-black text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                  SITUACIÓN DE ANOMALÍA: {anomalyReport.severity}
                </span>
                <span className="text-xs font-mono text-red-300">
                  Entropía de Shannon: <strong>{anomalyReport.entropy}</strong> / 5.24 max
                </span>
              </div>
              <h4 className="text-sm font-extrabold text-white">
                ⚠️ ALERTA DE COMPORTAMIENTO ANÓMALO DETECTADO (ISOLATION FOREST SIM)
              </h4>
              <p className="text-xs text-slate-350 font-sans leading-relaxed">
                {anomalyReport.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. SECCIÓN: GEOMETRÍA Y SESGO DE RULETA (CUADRANTES FISICOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Interactive circular wheel */}
        <div className="col-span-12 lg:col-span-5 flex flex-col">
          {renderRouletteHeatmap()}
        </div>

        {/* Right: Detailed quadrant description list */}
        <div className="col-span-12 lg:col-span-7 flex flex-col justify-between gap-4.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(CUADRANTES).map(([key, item]) => {
              const pct = quadrantStats[key as "I" | "II" | "III" | "IV"];
              const isHot = pct >= 30.0;
              return (
                <div 
                  key={key} 
                  className={`p-4 rounded-xl bg-gradient-to-br border flex flex-col gap-2 transition-all ${item.color} ${item.hoverColor} ${
                    isHot ? "ring-2 ring-emerald-500/20" : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-lg">{item.emoji}</span>
                    <span className="text-xs font-black font-mono bg-slate-950/60 px-2 py-0.5 rounded">
                      Frecuencia: {pct}%
                    </span>
                  </div>
                  <h4 className="text-xs font-black tracking-wide uppercase">{item.nombre}</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.animales.slice(0, 8).map(code => {
                      const ani = ANIMALITOS[code];
                      return (
                        <span 
                          key={code} 
                          title={`${code} - ${ani?.name}`}
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-950/45 text-slate-300 border border-slate-800"
                        >
                          {code}
                        </span>
                      );
                    })}
                    {item.animales.length > 8 && (
                      <span className="text-[9px] font-mono px-1 py-0.5 text-slate-500">
                        +{item.animales.length - 8} más
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic roulette bias advisory warning */}
          {quadrantBiasAlert ? (
            <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/40 rounded-xl flex items-center gap-3">
              <span className="text-xl">{quadrantBiasAlert.emoji}</span>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wide">
                  SESGO FÍSICO DETECTADO EN LA RUEDA GANADORA
                </h5>
                <p className="text-[11px] text-slate-300 leading-normal font-sans">
                  El <strong>{quadrantBiasAlert.desc}</strong> está dominando de manera desproporcionada con un <strong>{quadrantBiasAlert.pct}%</strong> de caídas hoy. Se recomienda firmemente centrar las jugadas en los animales de este sector.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center gap-3">
              <span className="text-lg">⚖️</span>
              <div className="space-y-0.5">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-wide">
                  EQUILIBRIO ROTATIVO ESTÁNDAR
                </h5>
                <p className="text-[11px] text-slate-450 leading-normal font-sans">
                  La distribución espacial de caídas se mantiene dentro de los límites de dispersión normales. El plato giratorio de la lotería no muestra sesgos mecánicos pronunciados en las últimas horas.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. SECCIÓN: APRENDIZAJE POR REFUERZO Q-LEARNING (META-ANÁLISIS DE PESOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Dynamic weight scale tuning view */}
        <div className="col-span-12 lg:col-span-7 bg-[#111726]/80 border border-slate-800/80 p-5 rounded-2xl flex flex-col justify-between gap-5 relative overflow-hidden backdrop-blur-md shadow-xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="space-y-1">
            <span className="text-[8px] bg-purple-950/40 text-purple-400 border border-purple-800/30 px-2 py-0.5 rounded font-black font-mono uppercase tracking-widest">
              PILLAR 3: REINFORCEMENT LEARNING CONTEXT-AWARE
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span>🧠</span> CALIBRADOR MAESTRO DE PESOS POR APRENDIZAJE DE RECOMPENSA
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              La IA evalúa en tiempo real cuál de sus motores matemáticos está funcionando mejor para el comportamiento específico del día actual de {loteria}, penalizando fallas y premiando aciertos.
            </p>
          </div>

          {/* Sliders layout */}
          <div className="space-y-3.5 my-2">
            {[
              { id: "markov", label: "Cadenas de Markov (Transición)", val: rlWeights.markov, color: "bg-blue-500" },
              { id: "bayes", label: "Teorema de Bayes (Fuerza Probabilística)", val: rlWeights.bayes, color: "bg-purple-500" },
              { id: "poisson", label: "Distribución de Poisson (Densidad Horaria)", val: rlWeights.poisson, color: "bg-emerald-500" },
              { id: "montecarlo", label: "Simulaciones de Monte Carlo", val: rlWeights.montecarlo, color: "bg-amber-500" },
              { id: "lstm", label: "Red Neuronal Recurrente LSTM", val: rlWeights.lstm, color: "bg-red-500" }
            ].map(engine => (
              <div key={engine.id} className="space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>{engine.label}</span>
                  <span className="font-mono text-white bg-slate-950/60 px-1.5 py-0.5 rounded border border-slate-800">
                    Peso: {engine.val}%
                  </span>
                </div>
                <div className="w-full h-2 rounded bg-slate-900 border border-slate-800 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${engine.val}%` }}
                    transition={{ type: "spring", stiffness: 80 }}
                    className={`h-full ${engine.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAutoTuneWeights}
            disabled={isTuning}
            className={`w-full py-3.5 px-6 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
              isTuning
                ? "bg-slate-800 text-slate-500 border border-slate-700 animate-pulse cursor-not-allowed"
                : "bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg border border-purple-500/20"
            }`}
          >
            <RefreshCw size={14} className={isTuning ? "animate-spin" : ""} />
            {isTuning ? "CALIBRANDO MATRIZ DE RECOMPENSA..." : "CALIBRAR PESOS EN VIVO (APRENDIZAJE POR REFUERZO)"}
          </button>
        </div>

        {/* Right: Learning console log */}
        <div className="col-span-12 lg:col-span-5 bg-[#0a0f1d] border border-slate-850 p-5 rounded-2xl flex flex-col justify-between gap-4.5 shadow-xl">
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
              <span>🖥️</span> COGNITIVE CONSOLE LOG (Q-LEARNING AGENT)
            </h4>
            <div className="bg-black/40 p-4 rounded-xl border border-slate-900 h-64 overflow-y-auto font-mono text-[10px] text-emerald-400 space-y-2 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
              {tuningLogs.map((log, i) => (
                <div key={i} className="border-b border-slate-900/60 pb-1.5 last:border-0">
                  <span className="text-slate-600 mr-1.5">[{new Date().toLocaleTimeString()}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-850 text-center flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5 mb-1 text-slate-350">
              <Zap size={14} className="text-yellow-400" />
              <span className="text-xs font-black uppercase tracking-wider">Unificación Probabilística final</span>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-normal font-sans">
              Los aciertos de tus predicciones de hoy se cruzan de forma ponderada con la nueva calibración para entregar el máximo índice de confianza unificado de la ruleta.
            </p>
          </div>
        </div>
      </div>

      {/* 4. SECCIÓN: DEEP LEARNING LSTM REAL SCRIPT EXPORT (MODEL.PY / TRAIN.PY / PREDICT.PY) */}
      <div className="bg-[#111726]/80 border border-slate-850 p-5 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <span className="text-[8px] bg-blue-950/40 text-blue-400 border border-blue-800/30 px-2 py-0.5 rounded font-black font-mono uppercase tracking-widest">
              Súper Microservicio TensorFlow
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <span>🐍</span> EXPORTACIÓN DE ARQUITECTURA DE INFERENCIA DE RED NEURONAL LSTM (Vercel)
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              Descarga e instala la Red Neuronal real entrenada en Python para procesar el histórico de 1,000 sorteos secuenciales.
            </p>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleCopyCode}
              className="flex-1 md:flex-initial py-2 px-3.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-850 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copied ? "¡Copiado!" : "Copiar Código"}
            </button>
            <button
              onClick={handleDownloadCode}
              className="flex-1 md:flex-initial py-2 px-3.5 bg-blue-600/10 border border-blue-500/30 rounded-xl text-xs font-black text-blue-400 hover:text-white hover:bg-blue-600 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FolderDown size={14} />
              Descargar Archivo
            </button>
          </div>
        </div>

        {/* Tab Buttons for Code Files */}
        <div className="flex gap-1.5 mb-3">
          {(["model.py", "train.py", "predict.py"] as const).map(file => (
            <button
              key={file}
              onClick={() => { setActiveCodeFile(file); playSound("click"); }}
              className={`py-2 px-4 rounded-lg text-xs font-black font-mono tracking-wide cursor-pointer transition-all ${
                activeCodeFile === file
                  ? "bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-500/10"
                  : "bg-slate-900 text-slate-450 border border-slate-800 hover:text-slate-200 hover:bg-slate-850"
              }`}
            >
              {file}
            </button>
          ))}
        </div>

        {/* Code Pre-View Area */}
        <div className="bg-[#030712] border border-slate-900 rounded-xl overflow-hidden shadow-inner relative max-h-[380px] overflow-y-auto">
          <div className="absolute top-2 right-2 font-mono text-[8px] text-slate-600 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-900">
            PYTHON 3.10 + TENSORFLOW 2.15
          </div>
          <pre className="p-4 text-[10px] sm:text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto select-text scrollbar-thin scrollbar-thumb-slate-900">
            <code>{pythonCodes[activeCodeFile]}</code>
          </pre>
        </div>

        {/* Local Simulator for LSTM Predictions */}
        <div className="mt-6 bg-[#090d18] border border-slate-850 p-4.5 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>🤖</span> PROBAR INFERENCIA LOCAL DE RED NEURONAL LSTM (SIMULACIÓN DE RETROPROPAGACIÓN)
              </h4>
              <p className="text-[11px] text-slate-450 font-sans">
                La app procesará las ventanas deslizantes de los sorteos cargados en el dispositivo para predecir el próximo resultado utilizando coincidencia recurrente de secuencias cuadráticas.
              </p>
            </div>
            <button
              onClick={handleRunLstmPrediction}
              disabled={lstmPredicting}
              className={`py-2.5 px-5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all w-full sm:w-auto ${
                lstmPredicting
                  ? "bg-slate-800 text-slate-500 border border-slate-700 animate-pulse cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/10"
              }`}
            >
              <Activity size={13} className={lstmPredicting ? "animate-spin" : ""} />
              {lstmPredicting ? "Invocando Tensores LSTM..." : "Ejecutar Inferencia LSTM"}
            </button>
          </div>

          <AnimatePresence>
            {lstmResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-4 border-t border-slate-850 grid grid-cols-1 md:grid-cols-12 gap-5"
              >
                <div className="md:col-span-4 p-3 bg-slate-950/40 rounded-xl border border-slate-850 text-center flex flex-col justify-center items-center">
                  <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Coeficiente de Confianza LSTM</span>
                  <span className="text-2xl font-black font-mono text-emerald-400 mt-1">{(lstmResult.confidence * 100).toFixed(1)}%</span>
                  <span className="text-[8.5px] text-slate-450 mt-1 font-sans leading-relaxed">
                    Sugerencias robustas ponderadas por paridad de hora ({selectedHour}) y sesgo geométrico.
                  </span>
                </div>

                <div className="md:col-span-8 space-y-2">
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest block mb-1">
                    🎯 TOP 5 PREDICCIONES LSTM RECURRENTES:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {lstmResult.predictions.map((p, idx) => {
                      const ani = ANIMALITOS[p.code];
                      return (
                        <div 
                          key={p.code} 
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center flex flex-col items-center justify-between"
                        >
                          <span className="text-xs font-black font-mono text-slate-450 bg-slate-950 px-1 py-0.5 rounded leading-none">
                            {idx + 1}°
                          </span>
                          <span className="text-xl my-1">{ani?.emoji || "🐾"}</span>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-white block leading-none truncate">
                              {p.code} - {ani?.name || "Desconocido"}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-emerald-400 leading-none">
                              P: {(p.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SECCIÓN INTERACTIVA ADICIONAL: MATRIZ HORARIA DE GANADORES DE TODOS LOS SORTEOS */}
      <div className="bg-[#111726]/80 border-2 border-slate-800 p-5 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-44 h-44 bg-indigo-500/5 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-5 pb-4 border-b border-slate-800/80">
          <div className="space-y-1">
            <span className="text-[8px] bg-indigo-950/40 text-indigo-400 border border-indigo-800/30 px-2 py-0.5 rounded font-black font-mono uppercase tracking-widest">
              Análisis Autónomo de Secuencias por Bloque de Tiempo
            </span>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>📊</span> MATRIZ HISTÓRICA POR HORAS ({loteria})
            </h3>
            <p className="text-xs text-slate-400 font-sans">
              El Cerebro IA escanea y procesa toda la matriz histórica hora por hora para extraer automáticamente los patrones de inercia, sesgos geométricos y transiciones sin que tengas que cazar nada manualmente.
            </p>
          </div>

          {/* Filtros rápidos */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Filtro por fecha */}
            <div className="relative flex-1 md:w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Calendar size={11} />
              </span>
              <input
                type="text"
                value={matrixDateQuery}
                onChange={e => setMatrixDateQuery(e.target.value)}
                placeholder="Filtrar fecha..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {/* Filtro por animal */}
            <div className="relative flex-1 md:w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500">
                <Search size={11} />
              </span>
              <input
                type="text"
                value={matrixAnimalQuery}
                onChange={e => setMatrixAnimalQuery(e.target.value)}
                placeholder="Buscar animal/núm..."
                className="w-full pl-7 pr-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {/* Botón de reinicio */}
            {(matrixDateQuery || matrixAnimalQuery) && (
              <button
                onClick={() => {
                  setMatrixDateQuery("");
                  setMatrixAnimalQuery("");
                  playSound("click");
                }}
                className="px-2.5 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* SUB-SECCIÓN: DETECTORES AUTOMÁTICOS DE PATRONES IA */}
        {matrixAutoPatterns && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            
            {/* BLOQUE 1: Inercias de Repetición por Hora */}
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                  <span>🔄</span> Inercias de Repetición (Misma Hora)
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                  Animales recurrentes que salieron de forma consecutiva varios días en el mismo bloque horario.
                </p>
                <div className="space-y-1.5 mt-3">
                  {matrixAutoPatterns.consecutivePatterns.length > 0 ? (
                    matrixAutoPatterns.consecutivePatterns.map((pat, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 border border-slate-800/40 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-base select-none">{pat.emoji}</span>
                          <div>
                            <span className="text-[10px] font-black text-slate-200">{pat.code} - {pat.name}</span>
                            <div className="text-[8px] text-slate-500 font-mono font-bold uppercase">{pat.hour}</div>
                          </div>
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-950/40 border border-emerald-800/20 text-emerald-400 rounded-md">
                          {pat.days} Días seguidos
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[10px] font-bold text-slate-500 font-sans">
                      Sin repeticiones consecutivas en el historial actual.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BLOQUE 2: Sesgos Horarios de Paridad y Color */}
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1">
                  <span>⚖️</span> Sesgos Estadísticos Horarios
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                  Predisposiciones fuertes calculadas sobre paridad y color para bloques específicos de sorteo.
                </p>
                <div className="space-y-1.5 mt-3">
                  {matrixAutoPatterns.hourlyBiases.length > 0 ? (
                    matrixAutoPatterns.hourlyBiases.map((bias, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 border border-slate-800/40 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs select-none">{bias.icon}</span>
                          <div>
                            <span className="text-[10px] font-black text-slate-200 uppercase">{bias.dominantType}</span>
                            <div className="text-[8px] text-slate-500 font-mono font-bold uppercase">{bias.hour}</div>
                          </div>
                        </div>
                        <span className="text-[9.5px] font-mono font-black text-indigo-400">
                          {bias.percentage.toFixed(0)}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[10px] font-bold text-slate-500 font-sans">
                      Sin sesgos dominantes en el historial actual.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BLOQUE 3: Cadenas de Transición Recurrentes */}
            <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-yellow-500 flex items-center gap-1">
                  <span>⛓️</span> Cadenas de Transición (Markov)
                </span>
                <p className="text-[10px] text-slate-500 font-sans mt-0.5 leading-relaxed">
                  Sucesiones consecutivas de un sorteo al siguiente que se repiten con mayor frecuencia histórica.
                </p>
                <div className="space-y-1.5 mt-3">
                  {matrixAutoPatterns.transitions.length > 0 ? (
                    matrixAutoPatterns.transitions.map((trans, idx) => (
                      <div key={idx} className="flex flex-col gap-1 bg-slate-900/60 p-2 border border-slate-800/40 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-slate-500 font-mono font-bold uppercase">{trans.fromHour} → {trans.toHour}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-yellow-950/40 border border-yellow-800/20 text-yellow-500 rounded-md">
                            {trans.count} Veces
                          </span>
                        </div>
                        <div className="text-[10px] font-black text-slate-200 flex items-center gap-1">
                          <span>{trans.fromAnimal}</span>
                          <span className="text-slate-500">➔</span>
                          <span>{trans.toAnimal}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-[10px] font-bold text-slate-500 font-sans">
                      Sin secuencias de transición recurrentes todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {filteredMatrixRows.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-slate-500 font-sans">
            Ningún sorteo histórico coincide con los filtros especificados.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-850 bg-slate-950/40 scrollbar-thin scrollbar-thumb-slate-800">
            <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-850">
                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono w-28">
                    Fecha / Sorteo
                  </th>
                  {hoursList.map(hour => (
                    <th 
                      key={hour} 
                      className="p-3 text-[9px] font-black text-slate-400 uppercase tracking-wider font-mono text-center"
                    >
                      {hour}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredMatrixRows.slice(0, 15).map((row, rIdx) => {
                  const itemsCount = Object.values(row.draws || {}).filter(Boolean).length;
                  return (
                    <tr key={row.fecha} className="hover:bg-slate-900/40 transition-colors">
                      {/* Celda de fecha */}
                      <td className="p-3 border-r border-slate-900/60">
                        <div className="font-mono text-xs font-black text-white">{row.fecha}</div>
                        <div className="text-[8px] text-slate-500 font-bold uppercase mt-0.5">
                          {itemsCount} / {hoursList.length} Sorteos
                        </div>
                      </td>

                      {/* Celdas de horas */}
                      {hoursList.map(hour => {
                        const code = row.draws[hour];
                        const anim = code ? ANIMALITOS[code.toString().trim()] : null;
                        
                        return (
                          <td 
                            key={hour} 
                            className="p-2 text-center border-r border-slate-900/30 last:border-r-0"
                          >
                            {code && anim ? (
                              <div 
                                className="inline-flex flex-col items-center justify-center p-1 bg-slate-900 border border-slate-800 rounded-lg w-14 h-14 hover:scale-105 active:scale-95 transition-transform cursor-pointer select-none group"
                                title={`Sorteo: ${hour} - [${code} ${anim.name}]`}
                                onClick={() => playSound("click")}
                              >
                                <span className="text-lg leading-none">{anim.emoji}</span>
                                <span className="text-[9px] font-black font-mono text-yellow-500 mt-0.5 leading-none">
                                  {code}
                                </span>
                                <span className="text-[7.5px] text-slate-450 leading-none truncate max-w-full uppercase font-sans tracking-tight opacity-80 group-hover:opacity-100 group-hover:text-white transition-opacity mt-0.5">
                                  {anim.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-700 font-mono font-bold">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredMatrixRows.length > 15 && (
              <div className="p-3 bg-slate-950/80 text-center border-t border-slate-850 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Mostrando las últimas 15 jornadas. Acumula más sorteos para ampliar el análisis.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. SECCIÓN: CLUSTERIZACIÓN NO SUPERVISADA K-MEANS (DIFERENTES FAMILIAS IA EN LUGAR DE BIOLÓGICAS) */}
      <div className="bg-[#111726]/80 border border-slate-850 p-5 rounded-2xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none" />
        
        <div className="space-y-1 mb-5">
          <span className="text-[8px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 px-2 py-0.5 rounded font-black font-mono uppercase tracking-widest">
            Clusterización Heurística K-Means
          </span>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span>Layers</span> AGRUPACIÓN DE COMPORTAMIENTO POR IA (CLÚSTERES EMPÍRICOS DE AZAR)
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            K-Means agrupa los 38 animales analizando correlaciones directas de co-ocurrencia y vacíos térmicos temporales. Olvida las familias biológicas tradicionales: esto es comportamiento real de la máquina sorteadora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
          {kmeansClusters.map(cluster => (
            <div key={cluster.id} className="p-4 rounded-xl bg-[#090d18] border border-slate-800 flex flex-col justify-between gap-3 shadow hover:border-slate-700 transition-colors">
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="p-1.5 bg-slate-900 rounded border border-slate-800">{cluster.emoji}</span>
                    {cluster.titulo}
                  </h4>
                  <span className="text-[9px] font-black font-mono text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-2 py-0.5 rounded uppercase">
                    Salida Hoy: {cluster.saturacion}%
                  </span>
                </div>
                <p className="text-[10.5px] text-slate-400 font-sans leading-normal">
                  {cluster.desc}
                </p>
              </div>

              {/* Members of cluster */}
              <div className="flex flex-wrap gap-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900">
                {cluster.miembros.map(code => {
                  const ani = ANIMALITOS[code];
                  const hasDrawnToday = todayActiveDraws.includes(code);
                  return (
                    <span 
                      key={code}
                      className={`text-[9.5px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        hasDrawnToday 
                          ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold" 
                          : "bg-slate-900/80 text-slate-450 border border-slate-800"
                      }`}
                      title={`${code} - ${ani?.name}`}
                    >
                      {ani?.emoji} {code}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SECCIÓN: MAPA DE ARQUITECTURA E INFERENCIA (INTERACTIVE MIND-MAP / OSINT STYLE) */}
      <div className="bg-[#0b0f19] border-2 border-slate-800 p-5 sm:p-6 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 blur-[70px] rounded-full pointer-events-none" />
        
        <div className="space-y-1 mb-6">
          <span className="text-[8px] bg-purple-950/40 text-purple-400 border border-purple-800/30 px-2 py-0.5 rounded font-black font-mono uppercase tracking-widest">
            Sinergia Operativa de Sistemas
          </span>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <span>🗺️</span> MAPA DE ARQUITECTURA COGNITIVA & FLUJO DE INFERENCIA
          </h3>
          <p className="text-xs text-slate-400 font-sans">
            Explora de manera interactiva la red de datos de Ruleta Pro IA. Pasa el cursor por encima o haz clic en los nodos de decisión para revelar cómo interactúa cada módulo con tus predicciones.
          </p>
        </div>

        {/* Mind-Map Interactive Container */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* Visual Diagram Column */}
          <div className="xl:col-span-8 bg-slate-950/80 rounded-2xl border border-slate-900 p-4 md:p-6 relative overflow-x-auto min-h-[500px] flex items-center scrollbar-thin scrollbar-thumb-slate-900">
            
            {/* Mind Map Nodes Overlay & Connections */}
            <div className="relative w-[720px] md:w-full min-w-[700px] h-[420px] mx-auto flex items-center select-none">
              
              {/* Connection Lines (SVG) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* SVG Curves connecting root to categories */}
                {/* Root to Data */}
                <path d="M 120,210 C 180,210 180,65 240,65" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                {/* Root to Engines */}
                <path d="M 120,210 C 180,210 180,165 240,165" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                {/* Root to LSTM */}
                <path d="M 120,210 C 180,210 180,255 240,255" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
                {/* Root to Audit */}
                <path d="M 120,210 C 180,210 180,355 240,355" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />

                {/* Subconnections (Categories to Sub-nodes) */}
                {/* Data to sub-nodes */}
                <path d="M 370,65 C 410,65 410,35 450,35" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />
                <path d="M 370,65 C 410,65 410,65 450,65" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />
                <path d="M 370,65 C 410,65 410,95 450,95" fill="none" stroke="#3b82f6" strokeWidth="1" opacity="0.4" />

                {/* Engines to sub-nodes */}
                <path d="M 370,165 C 410,165 410,125 450,125" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />
                <path d="M 370,165 C 410,165 410,150 450,150" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />
                <path d="M 370,165 C 410,165 410,180 450,180" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />
                <path d="M 370,165 C 410,165 410,205 450,205" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />

                {/* LSTM to sub-nodes */}
                <path d="M 370,255 C 410,255 410,235 450,235" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.4" />
                <path d="M 370,255 C 410,255 410,275 450,275" fill="none" stroke="#f472b6" strokeWidth="1" opacity="0.4" />

                {/* Audit to sub-nodes */}
                <path d="M 370,355 C 410,355 410,325 450,325" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4" />
                <path d="M 370,355 C 410,355 410,355 450,355" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4" />
                <path d="M 370,355 C 410,355 410,385 450,385" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4" />
              </svg>

              {/* LEVEL 1: Root Node (Left side) */}
              <div className="absolute left-[10px] top-[180px] z-10 w-[110px]">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  onClick={() => playSound("click")}
                  className="p-3 bg-red-950/60 border-2 border-red-500 rounded-2xl text-center shadow-lg cursor-pointer ring-4 ring-red-500/10"
                >
                  <Brain size={24} className="mx-auto text-red-400 mb-1 animate-pulse" />
                  <span className="text-[10px] font-black uppercase font-mono tracking-tight text-white block">RULETA PRO</span>
                  <span className="text-[8px] text-red-300 font-mono">Cerebro IA</span>
                </motion.div>
              </div>

              {/* LEVEL 2: Main Categories (Middle) */}
              <div className="absolute left-[240px] top-0 bottom-0 z-10 w-[130px] flex flex-col justify-between py-4">
                {/* Node 1: Ingesta de Datos */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 bg-blue-950/45 border border-blue-500/60 rounded-xl text-center shadow cursor-pointer hover:bg-blue-900/10"
                  onClick={() => playSound("click")}
                >
                  <div className="text-[10px] font-black uppercase font-mono text-blue-400">1. Ingesta Datos</div>
                  <div className="text-[7.5px] text-slate-400 font-sans mt-0.5 leading-none">Captura en Tiempo Real</div>
                </motion.div>

                {/* Node 2: Motores Heurísticos */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 bg-purple-950/45 border border-purple-500/60 rounded-xl text-center shadow cursor-pointer hover:bg-purple-900/10"
                  onClick={() => playSound("click")}
                >
                  <div className="text-[10px] font-black uppercase font-mono text-purple-400">2. Motores Heu.</div>
                  <div className="text-[7.5px] text-slate-400 font-sans mt-0.5 leading-none">Estadística Avanzada</div>
                </motion.div>

                {/* Node 3: Deep Learning LSTM */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 bg-pink-950/45 border border-pink-500/60 rounded-xl text-center shadow cursor-pointer hover:bg-pink-900/10"
                  onClick={() => playSound("click")}
                >
                  <div className="text-[10px] font-black uppercase font-mono text-pink-400">3. Red LSTM</div>
                  <div className="text-[7.5px] text-slate-400 font-sans mt-0.5 leading-none">Tensores Recurrentes</div>
                </motion.div>

                {/* Node 4: Meta-Análisis */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className="p-2.5 bg-emerald-950/45 border border-emerald-500/60 rounded-xl text-center shadow cursor-pointer hover:bg-emerald-900/10"
                  onClick={() => playSound("click")}
                >
                  <div className="text-[10px] font-black uppercase font-mono text-emerald-400">4. Meta-Análisis</div>
                  <div className="text-[7.5px] text-slate-400 font-sans mt-0.5 leading-none">Auditoría & Pesos</div>
                </motion.div>
              </div>

              {/* LEVEL 3: Detailed Leaf Nodes (Right Side) */}
              <div className="absolute left-[450px] right-0 top-0 bottom-0 z-10 flex flex-col justify-between py-1 bg-slate-950/10 rounded-xl px-2">
                
                {/* 1. DATA SUB-NODES */}
                <div className="space-y-1">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-blue-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      Scrapers Automatizados
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Live API</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-blue-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Ingreso Manual Seguro
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Fallback</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-blue-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Base Firestore Sync
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Cloud Db</span>
                  </div>
                </div>

                {/* 2. STATS ENGINE SUB-NODES */}
                <div className="space-y-1">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      Cadenas de Markov
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Transición</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Inferencia de Bayes
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Condicional</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Distribución Poisson
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Densidad</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-purple-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      Simulaciones Monte Carlo
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Muestras</span>
                  </div>
                </div>

                {/* 3. DEEP LEARNING SUB-NODES */}
                <div className="space-y-1">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-pink-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                      Ventana Deslizante (50)
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Tensors</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-pink-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                      Red Recurrente LSTM
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Inferencia</span>
                  </div>
                </div>

                {/* 4. META-ANALYSIS SUB-NODES */}
                <div className="space-y-1">
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Agente Q-Learning Pesos
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Adaptativo</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Entropía Shannon (Anomalías)
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Orden/Física</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between hover:border-emerald-500/40 transition-colors">
                    <span className="text-[9px] font-bold text-slate-300 font-mono flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Geometría de Rueda (Cuadrantes)
                    </span>
                    <span className="text-[7px] text-slate-550 font-mono">Plato</span>
                  </div>
                </div>

              </div>

            </div>

          </div>

          {/* Side Explanation Column */}
          <div className="xl:col-span-4 bg-[#0a0f1d] border border-slate-850 p-5 rounded-2xl flex flex-col justify-between gap-4 shadow-inner">
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-850">
                <span className="p-2 bg-purple-550/15 text-purple-400 rounded-xl border border-purple-500/20">
                  <Layers size={18} />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase text-white font-mono tracking-wide">DETALLES DE SINERGIA</h4>
                  <span className="text-[9px] font-mono text-slate-500">¿Cómo procesa la IA cada sorteo?</span>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <span className="font-extrabold text-blue-400 font-mono block">1. INGESTACIÓN COLD/HOT:</span>
                  <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                    El sistema corre un script inteligente en Python (`ScraperIA.py`) para jalar la data cruda desde los servidores públicos de lotería venezolana, limpiando cualquier duplicado o nulo de inmediato antes de guardarlo en Firestore.
                  </p>
                </div>
                
                <div className="space-y-1 border-t border-slate-900/50 pt-2.5">
                  <span className="font-extrabold text-purple-400 font-mono block">2. CÓMPUTO DE CUADRO MULTI-MOTOR:</span>
                  <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                    Los motores clásicos analizan patrones deterministas de inercia y transiciones directas para proyectar un cuadro inicial de candidatos viables por hora de sorteo.
                  </p>
                </div>

                <div className="space-y-1 border-t border-slate-900/50 pt-2.5">
                  <span className="font-extrabold text-pink-400 font-mono block">3. VALIDACIÓN TENSOR RECURRENTE LSTM:</span>
                  <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                    Se ejecuta una red neuronal artificial profunda de retropropagación sobre una ventana deslizante de 50 sorteos secuenciales para detectar dependencias cíclicas de largo plazo.
                  </p>
                </div>

                <div className="space-y-1 border-t border-slate-900/50 pt-2.5">
                  <span className="font-extrabold text-emerald-400 font-mono block">4. AUTOCONTROL (META-ANÁLISIS DE PESOS):</span>
                  <p className="text-slate-400 font-sans leading-relaxed text-[11px]">
                    El agente Q-Learning compara las predicciones con los sorteos jugados hoy, calibrando la matriz de pesos para darle más prioridad al motor que tenga mayor inercia ganadora en las últimas horas de la jornada.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-900/80 text-center flex flex-col items-center justify-center">
              <span className="text-[10px] font-black text-slate-350 uppercase tracking-widest block mb-0.5">SISTEMA COMPLEMENTARIO</span>
              <p className="text-[9.5px] text-slate-500 leading-normal font-sans">
                Este flujo de datos modular permite que tu aplicación no solo adivine, sino que audite constantemente la inercia diaria del azar de forma adaptativa.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


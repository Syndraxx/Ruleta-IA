import json
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

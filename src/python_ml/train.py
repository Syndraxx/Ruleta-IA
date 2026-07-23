import numpy as np
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
        patience=5, 
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
    return True

if __name__ == "__main__":
    # Generador de simulación sintética de 1000 sorteos para verificar correctitud matemática
    print("🧪 Simulando entrenamiento de validación...")
    mock_history = [str(np.random.randint(0, 37)).zfill(2) for _ in range(1000)]
    mock_history = ["00" if x == "00" or x == "37" else x for x in mock_history]
    
    train_and_save(mock_history, epochs=5, batch_size=16)

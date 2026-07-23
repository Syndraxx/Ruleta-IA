import tensorflow as tf
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
    return model

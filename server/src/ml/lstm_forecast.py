# LSTM time-series forecast for sentiment/price (demo, Keras)
from flask import Flask, request, jsonify
import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
import json

app = Flask(__name__)

def create_lstm_model(input_shape):
    model = Sequential()
    model.add(LSTM(32, input_shape=input_shape))
    model.add(Dense(1))
    model.compile(optimizer='adam', loss='mse')
    return model

@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.json
    series = np.array([x['y'] for x in data['history']])
    X, y = [], []
    window = 5
    for i in range(len(series) - window):
        X.append(series[i:i+window])
        y.append(series[i+window])
    X, y = np.array(X), np.array(y)
    X = X.reshape((X.shape[0], X.shape[1], 1))
    model = create_lstm_model((window, 1))
    model.fit(X, y, epochs=10, verbose=0)
    last_seq = series[-window:]
    preds = []
    for _ in range(data.get('periods', 10)):
        input_seq = last_seq.reshape((1, window, 1))
        pred = model.predict(input_seq, verbose=0)[0][0]
        preds.append(float(pred))
        last_seq = np.append(last_seq[1:], pred)
    result = [{"ds": None, "yhat": float(val)} for val in preds]
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5012)

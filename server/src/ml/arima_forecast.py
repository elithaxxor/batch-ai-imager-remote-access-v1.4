# ARIMA time-series forecast for sentiment/price
from flask import Flask, request, jsonify
import pandas as pd
import json
from statsmodels.tsa.arima.model import ARIMA

app = Flask(__name__)

@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.json
    df = pd.DataFrame(data['history'])
    order = data.get('order', (2,1,2))
    model = ARIMA(df['y'], order=order)
    model_fit = model.fit()
    forecast = model_fit.forecast(steps=data.get('periods', 10))
    result = [{"ds": None, "yhat": float(val)} for val in forecast]
    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5011)

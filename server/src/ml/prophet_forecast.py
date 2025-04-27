# Prophet time-series forecast for sentiment/price
from flask import Flask, request, jsonify
from fbprophet import Prophet
import pandas as pd
import json

app = Flask(__name__)

@app.route('/forecast', methods=['POST'])
def forecast():
    data = request.json
    df = pd.DataFrame(data['history'])
    model = Prophet()
    model.fit(df)
    future = model.make_future_dataframe(periods=data.get('periods', 10))
    forecast = model.predict(future)
    return jsonify(forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].to_dict(orient='records'))

if __name__ == '__main__':
    app.run(port=5010)

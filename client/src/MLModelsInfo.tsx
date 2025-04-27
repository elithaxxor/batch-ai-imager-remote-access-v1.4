import React from 'react';
import { Card, CardHeader, CardContent } from '@mui/material';

const models = [
  {
    name: 'Prophet',
    type: 'Additive Time-Series Forecasting',
    pros: [
      'Handles seasonality and holidays well',
      'Robust to missing data and outliers',
      'Easy to tune and interpret',
      'Fast for medium-sized datasets'
    ],
    cons: [
      'Assumes additive effects (may not capture all non-linearities)',
      'Not optimal for highly non-stationary or regime-shifting data',
      'Limited to univariate forecasting'
    ]
  },
  {
    name: 'ARIMA',
    type: 'Statistical Time-Series Forecasting',
    pros: [
      'Strong for stationary, linear time series',
      'Transparent and interpretable',
      'Well-studied in econometrics'
    ],
    cons: [
      'Requires manual parameter tuning',
      'Struggles with non-linear/seasonal patterns',
      'Sensitive to outliers and missing data'
    ]
  },
  {
    name: 'LSTM',
    type: 'Deep Learning Sequence Model',
    pros: [
      'Captures complex, non-linear temporal dependencies',
      'Effective for long sequences',
      'Can model multivariate series'
    ],
    cons: [
      'Requires large datasets and compute',
      'Harder to interpret',
      'Prone to overfitting if not tuned carefully',
      'Longer training times'
    ]
  }
];

export default function MLModelsInfo() {
  return (
    <div style={{ maxWidth: 900, margin: '2rem auto' }}>
      <h2>Machine Learning Models Used</h2>
      <p>This app leverages several advanced models for time-series forecasting and analytics. Below is a summary of each, including their strengths and weaknesses:</p>
      {models.map(model => (
        <Card key={model.name} style={{ margin: '2rem 0', background: '#f6fafd' }}>
          <CardHeader title={<span><b>{model.name}</b> <span style={{ color: '#888', fontWeight: 'normal' }}>({model.type})</span></span>} />
          <CardContent>
            <div style={{ display: 'flex', gap: 40 }}>
              <div>
                <b>Pros:</b>
                <ul>{model.pros.map(p => <li key={p}>{p}</li>)}</ul>
              </div>
              <div>
                <b>Cons:</b>
                <ul>{model.cons.map(c => <li key={c}>{c}</li>)}</ul>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

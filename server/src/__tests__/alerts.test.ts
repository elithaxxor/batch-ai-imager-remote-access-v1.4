import request from 'supertest';
import app from '../../src/app';

describe('Price Alerts API', () => {
  let alertId: number | null = null;

  it('should create a new price alert', async () => {
    const res = await request(app)
      .post('/api/price-alerts')
      .send({
        symbol: 'AAPL',
        type: 'price',
        threshold: 100,
        direction: 'above',
        notify: { email: 'test@example.com' },
        tradingViewParams: { interval: '1m' }
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should get alert status', async () => {
    const res = await request(app).get('/api/price-alerts/status');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should trigger a test alert', async () => {
    const statusRes = await request(app).get('/api/price-alerts/status');
    const idx = 0;
    const res = await request(app).post(`/api/price-alerts/test/${idx}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should get alert history', async () => {
    const res = await request(app).get('/api/price-alerts/history');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

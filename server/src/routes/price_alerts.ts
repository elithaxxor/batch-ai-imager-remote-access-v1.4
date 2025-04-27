import { Router } from 'express';
import { addPriceAlert, removePriceAlert } from '../alerts/priceAlertScheduler';

const router = Router();

// In-memory only for demo; use a DB in production
let alerts: any[] = [];

router.get('/', (req, res) => {
  res.json(alerts);
});

router.post('/', (req, res) => {
  const alert = req.body;
  alerts.push(alert);
  addPriceAlert(alert);
  res.json({ success: true });
});

router.delete('/:idx', (req, res) => {
  const idx = parseInt(req.params.idx, 10);
  if (idx >= 0 && idx < alerts.length) {
    alerts.splice(idx, 1);
    removePriceAlert(idx);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;

import { Router } from 'express';
import { loadAlerts, saveAlerts } from '../alertsStore';

const router = Router();

router.get('/', (req, res) => {
  res.json({ alerts: loadAlerts() });
});

router.post('/', (req, res) => {
  const { alert } = req.body;
  const alerts = loadAlerts();
  alerts.push(alert);
  saveAlerts(alerts);
  res.json({ success: true });
});

router.delete('/', (req, res) => {
  const { alert } = req.body;
  let alerts = loadAlerts();
  alerts = alerts.filter(a => JSON.stringify(a) !== JSON.stringify(alert));
  saveAlerts(alerts);
  res.json({ success: true });
});

export default router;

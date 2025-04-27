import { Router } from 'express';
import { getAlertEvents, clearAlertEvents } from '../alerts/alertHistoryStore';

const router = Router();

router.get('/', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  res.json(getAlertEvents(limit));
});

router.delete('/', (req, res) => {
  clearAlertEvents();
  res.json({ success: true });
});

export default router;

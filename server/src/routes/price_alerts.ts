/**
 * Express router for price alert API endpoints.
 * Handles CRUD operations for alerts, exposes alert status and test endpoints.
 * All alert operations are performed on the shared priceAlerts array from the scheduler.
 */
import { Router } from 'express';
import { addPriceAlert, removePriceAlert, priceAlerts, PriceAlert } from '../alerts/priceAlertScheduler';
import { getAlertEvents } from '../alerts/alertHistoryStore';

const router = Router();

/**
 * GET /api/price-alerts
 * Returns the current list of all price alerts.
 */
router.get('/', (req, res) => {
  // Return the current list of price alerts
  res.json(priceAlerts);
});

/**
 * GET /api/price-alerts/status
 * Returns the status for each alert (index, symbol, type, threshold, direction).
 */
router.get('/status', (req, res) => {
  // Compose status for each alert
  const status = priceAlerts.map((alert, idx) => ({
    idx,
    symbol: alert.symbol || alert.id,
    type: alert.type,
    threshold: alert.threshold,
    direction: alert.direction,
    // Optionally add more fields as needed
  }));
  // Return the composed status
  res.json(status);
});

/**
 * GET /api/price-alerts/history
 * Returns a list of recent alert events (max 100).
 */
router.get('/history', (req, res) => {
  // Retrieve recent alert events from the alert history store
  res.json(getAlertEvents(100));
});

/**
 * POST /api/price-alerts
 * Adds a new price alert to the system.
 * @body {PriceAlert} alert - The alert object to add.
 */
router.post('/', (req, res) => {
  // Extract the alert object from the request body
  const alert = req.body;
  // Add the alert to the system using the price alert scheduler
  addPriceAlert(alert);
  // Return a success response
  res.json({ success: true });
});

/**
 * DELETE /api/price-alerts/:idx
 * Removes an alert by its index.
 * @param idx - The index of the alert to remove.
 */
router.delete('/:idx', (req, res) => {
  // Extract the index from the URL parameter
  const idx = parseInt(req.params.idx, 10);
  // Check if the index is valid
  if (idx >= 0 && idx < priceAlerts.length) {
    // Remove the alert from the system using the price alert scheduler
    removePriceAlert(idx);
    // Return a success response
    res.json({ success: true });
  } else {
    // Return a 404 error response if the index is invalid
    res.status(404).json({ error: 'Not found' });
  }
});

/**
 * POST /api/price-alerts/test/:idx
 * Simulates triggering an alert for testing purposes.
 * @param idx - The index of the alert to test.
 */
router.post('/test/:idx', async (req, res) => {
  // Extract the index from the URL parameter
  const idx = parseInt(req.params.idx, 10);
  // Check if the index is valid
  if (idx >= 0 && idx < priceAlerts.length) {
    // Simulate alert trigger logic for this alert
    const alert = priceAlerts[idx];
    // For demo, log a test event
    const msg = `[TEST] Alert triggered for ${alert.symbol || alert.id}`;
    // Extract notified users from the alert object
    const notifiedUsers = [];
    const notify = alert.notify as import('../alerts/priceAlertScheduler').User;
    if (notify && typeof notify === 'object' && !('allUsers' in notify)) {
      if (notify.email) notifiedUsers.push(notify.email);
      if (notify.slack) notifiedUsers.push(notify.slack);
      if (notify.telegramChatId) notifiedUsers.push(notify.telegramChatId);
      if (notify.smsTo) notifiedUsers.push(notify.smsTo);
    }
    // Log the test event to the alert history store
    require('../alerts/alertHistoryStore').logAlertEvent({ timestamp: Date.now(), alert, price: null, message: msg, notifiedUsers });
    // Return a success response with the test message
    res.json({ success: true, message: msg });
  } else {
    // Return a 404 error response if the index is invalid
    res.status(404).json({ error: 'Not found' });
  }
});

export default router;

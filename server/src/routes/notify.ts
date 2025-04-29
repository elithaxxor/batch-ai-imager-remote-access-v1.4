import { Router } from 'express';
import { sendEmailNotification } from '../notifications/email';
import { sendDiscordNotification } from '../notifications/discord';
import { sendPushNotification } from '../notifications/push';
import { sendSlackNotification } from '../notifications/slack';
import { sendTelegramNotification } from '../notifications/telegram';
import { sendSMSNotification } from '../notifications/sms_twilio';

const router = Router();

router.post('/email', async (req, res) => {
  const { to, subject, text } = req.body;
  try {
    await sendEmailNotification(to, subject, text);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/discord', async (req, res) => {
  const { webhookUrl, message } = req.body;
  try {
    await sendDiscordNotification(webhookUrl, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/push', async (req, res) => {
  const { userKey, message } = req.body;
  try {
    await sendPushNotification(userKey, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/slack', async (req, res) => {
  const { webhookUrl, message } = req.body;
  try {
    await sendSlackNotification(webhookUrl, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/telegram', async (req, res) => {
  const { botToken, chatId, message } = req.body;
  try {
    await sendTelegramNotification(botToken, chatId, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/sms', async (req, res) => {
  const { accountSid, authToken, from, to, message } = req.body;
  try {
    await sendSMSNotification(accountSid, authToken, from, to, message);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;

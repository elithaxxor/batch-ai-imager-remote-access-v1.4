// Push notification (Pushover demo)
import fetch from 'node-fetch';

export async function sendPushNotification(userKey: string, message: string) {
  const token = process.env.PUSHOVER_API_TOKEN;
  if (!token) throw new Error('Missing PUSHOVER_API_TOKEN');
  await fetch('https://api.pushover.net/1/messages.json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      token,
      user: userKey,
      message
    })
  });
}

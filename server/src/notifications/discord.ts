// Discord notification (webhook demo)
import fetch from 'node-fetch';

export async function sendDiscordNotification(webhookUrl: string, message: string) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: message })
  });
}

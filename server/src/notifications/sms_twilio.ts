// SMS notification (Twilio demo)
import twilio from 'twilio';

export async function sendSMSNotification(accountSid: string, authToken: string, from: string, to: string, message: string) {
  const client = twilio(accountSid, authToken);
  await client.messages.create({ body: message, from, to });
}

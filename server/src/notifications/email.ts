// Email notification (SendGrid demo)
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendEmailNotification(to: string, subject: string, text: string) {
  if (!process.env.SENDGRID_API_KEY) throw new Error('Missing SENDGRID_API_KEY');
  const msg = {
    to,
    from: process.env.EMAIL_FROM || 'alerts@memecoin-sentiment.com',
    subject,
    text,
  };
  await sgMail.send(msg);
}

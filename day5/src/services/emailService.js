const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../config/logger');

let transporter;

async function getTransporter() {
  if (transporter) return transporter;

  if (env.EMAIL_HOST) {
    transporter = nodemailer.createTransport({
      host: env.EMAIL_HOST,
      port: env.EMAIL_PORT || 587,
      auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
    });
  } else {
    try {
      // Ethereal creates a real test account via an HTTP call — can fail if offline
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      logger.info({ user: testAccount.user }, 'Ethereal SMTP ready (dev mode)');
    } catch (err) {
      // Ethereal is unavailable — use a no-op transport so the app keeps running
      logger.warn('Ethereal unavailable, emails will be logged only');
      transporter = {
        sendMail: async (mail) => {
          logger.info({ to: mail.to, subject: mail.subject }, 'Email (not sent — no SMTP)');
          return { messageId: 'skipped' };
        },
      };
    }
  }

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  const t = await getTransporter();
  const info = await t.sendMail({ from: env.EMAIL_FROM, to, subject, html });

  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    logger.info({ previewUrl }, 'Email preview (Ethereal)');
  }

  return info;
}

module.exports = { sendEmail };

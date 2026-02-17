import nodemailer from 'nodemailer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOGO_PATH = join(__dirname, '..', 'common', 'plantillasEmail', 'logo.svg');

let logoBuffer;
try {
  logoBuffer = readFileSync(LOGO_PATH);
} catch {
  logoBuffer = null;
}

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: true,
  auth: {
    user: process.env.ADDRESS,
    pass: process.env.PASSWORD,
  },
});

export const sendEmail = async ({ recipient, subject, message }) => {
  const attachments = logoBuffer
    ? [{ filename: 'logo.svg', content: logoBuffer, cid: 'bioalquimia-logo', contentType: 'image/svg+xml' }]
    : [];

  return await transporter.sendMail({
    from: process.env.ADDRESS,
    to: recipient,
    subject,
    text: message,
    html: message,
    attachments,
  });
};
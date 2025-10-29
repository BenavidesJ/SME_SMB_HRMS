import nodemailer from 'nodemailer';

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
  return await transporter.sendMail({
    from: process.env.ADDRESS,
    to: recipient,
    subject,
    text: message,
    html: message,
  });
};
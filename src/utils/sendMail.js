import nodemailer from 'nodemailer';

import { SMTP } from '../constants/index.js';
import { getEnvVar } from '../utils/getEnvVar.js';

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: getEnvVar(SMTP.SMTP_HOST),
      port: Number(getEnvVar(SMTP.SMTP_PORT)),
      auth: {
        user: getEnvVar(SMTP.SMTP_USER),
        pass: getEnvVar(SMTP.SMTP_PASSWORD),
      },
    });
  }

  return transporter;
};

export const sendEmail = async (options) => {
  return await getTransporter().sendMail(options);
};

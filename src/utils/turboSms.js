import createHttpError from 'http-errors';

const API_URL = 'https://api.turbosms.ua/message/send.json';

// TurboSMS reports success per recipient as 0 or an 8xx "SUCCESS_MESSAGE_*"
// code; anything else (1xx–4xx) is an error with its status text.
const isSuccessCode = (code) => code === 0 || (code >= 800 && code < 900);

// Sends one SMS via TurboSMS (turbosms.ua). `phoneNumber` is the site's
// 10-digit local format (0991234567); TurboSMS wants it as 380991234567.
//
// SMS_DEV_MODE=true skips TurboSMS entirely and prints the text to the
// server log instead — for local development only, never in production.
export const sendSms = async (phoneNumber, text) => {
  if (process.env.SMS_DEV_MODE === 'true') {
    console.log(`[SMS_DEV_MODE] to ${phoneNumber}: ${text}`);
    return;
  }

  const token = process.env.TURBOSMS_TOKEN;
  const sender = process.env.TURBOSMS_SENDER;
  if (!token || !sender) {
    // 4xx on purpose — see the note on 424 in services/sms.js.
    throw createHttpError(424, 'Надсилання SMS ще не налаштовано');
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      recipients: [`38${phoneNumber}`],
      sms: { sender, text },
    }),
    signal: AbortSignal.timeout(10000),
  });

  const data = await response.json().catch(() => null);
  const result = data?.response_result?.[0];
  const code = result?.response_code ?? data?.response_code;

  if (!response.ok || !isSuccessCode(code)) {
    throw new Error(
      `TurboSMS error: HTTP ${response.status}, ${code} ${result?.response_status ?? data?.response_status ?? ''}`,
    );
  }
};

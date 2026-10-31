import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { randomInt } from 'crypto';
import { SmsCodesCollection } from '../db/models/smsCodes.js';
import { SmsSendsCollection } from '../db/models/smsSends.js';
import { UsersCollection } from '../db/models/user.js';
import { sendSms } from '../utils/turboSms.js';

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;
const MAX_PER_PHONE_PER_HOUR = 5;
const MAX_PER_IP_PER_HOUR = 10;
// A hard ceiling on all SMS in 24h — the last line of defence against
// someone scripting the endpoint to burn the TurboSMS balance.
const dailyLimit = () => Number(process.env.SMS_DAILY_LIMIT) || 500;

const MESSAGES = {
  register: (code) => `Сусіди: код підтвердження ${code}`,
  reset: (code) => `Сусіди: код для відновлення пароля ${code}`,
};

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60 * 1000);

const enforceRateLimits = async (phoneNumber, ip) => {
  const lastSend = await SmsSendsCollection.findOne({ phoneNumber }).sort({
    createdAt: -1,
  });
  if (lastSend) {
    const secondsLeft = Math.ceil(
      RESEND_COOLDOWN_SECONDS - (Date.now() - lastSend.createdAt) / 1000,
    );
    if (secondsLeft > 0) {
      throw createHttpError(
        429,
        `Новий код можна надіслати через ${secondsLeft} с`,
      );
    }
  }

  const [perPhone, perIp, total] = await Promise.all([
    SmsSendsCollection.countDocuments({
      phoneNumber,
      createdAt: { $gte: minutesAgo(60) },
    }),
    ip
      ? SmsSendsCollection.countDocuments({
          ip,
          createdAt: { $gte: minutesAgo(60) },
        })
      : 0,
    SmsSendsCollection.estimatedDocumentCount(),
  ]);

  if (perPhone >= MAX_PER_PHONE_PER_HOUR || perIp >= MAX_PER_IP_PER_HOUR) {
    throw createHttpError(429, 'Забагато запитів коду — спробуйте пізніше');
  }
  if (total >= dailyLimit()) {
    console.error(`SMS daily limit (${dailyLimit()}) reached`);
    throw createHttpError(
      429,
      'Надсилання SMS тимчасово недоступне — спробуйте пізніше',
    );
  }
};

export const requestSmsCode = async ({ phoneNumber, purpose, ip }) => {
  const registered = await UsersCollection.exists({
    phoneNumber,
    password: { $exists: true, $ne: null },
  });
  if (purpose === 'register' && registered) {
    throw createHttpError(409, 'Цей номер уже зареєстрований — увійдіть');
  }
  if (purpose === 'reset' && !registered) {
    throw createHttpError(404, 'Користувача з таким номером не знайдено');
  }

  await enforceRateLimits(phoneNumber, ip);

  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await SmsCodesCollection.findOneAndUpdate(
    { phoneNumber, purpose },
    {
      codeHash: await bcrypt.hash(code, 8),
      attempts: 0,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
    },
    { upsert: true },
  );

  try {
    await sendSms(phoneNumber, MESSAGES[purpose](code));
  } catch (err) {
    await SmsCodesCollection.deleteOne({ phoneNumber, purpose });
    if (err.status) throw err;
    console.error('Failed to send SMS', err);
    // 424, not 502/503: DigitalOcean's edge (Cloudflare) replaces 5xx
    // bodies with its own, so the customer would only see a generic
    // "Сталася помилка" instead of this message.
    throw createHttpError(424, 'Не вдалося надіслати SMS — спробуйте ще раз');
  }

  await SmsSendsCollection.create({ phoneNumber, ip });

  return { resendIn: RESEND_COOLDOWN_SECONDS };
};

// Checks a code and, if right, deletes it so it can't be used twice.
// Throws a user-facing 400/429 otherwise.
export const consumeSmsCode = async ({ phoneNumber, purpose, code }) => {
  const record = await SmsCodesCollection.findOne({ phoneNumber, purpose });

  if (!record || record.expiresAt.getTime() < Date.now()) {
    throw createHttpError(
      400,
      'Код недійсний або прострочений — надішліть новий',
    );
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await SmsCodesCollection.deleteOne({ _id: record._id });
    throw createHttpError(429, 'Забагато спроб — надішліть новий код');
  }

  const matches = await bcrypt.compare(code, record.codeHash);
  if (!matches) {
    await SmsCodesCollection.updateOne(
      { _id: record._id },
      { $inc: { attempts: 1 } },
    );
    throw createHttpError(400, 'Невірний код');
  }

  await SmsCodesCollection.deleteOne({ _id: record._id });
};

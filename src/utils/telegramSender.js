import { Telegraf } from 'telegraf';
import { CITY_LABELS, PICKUP_POINTS } from '../constants/index.js';

const defaultBot = {
  token: process.env.TELEGRAM_KEY,
  chatId: process.env.TELEGRAM_CHAT_ID,
};

// Кожна з 5 точок самовивозу може мати власний Telegram-бот — заповни
// відповідні TELEGRAM_KEY_*/TELEGRAM_CHAT_ID_* у .env. Точка без своїх
// змінних падає в дефолтний бот — так само, як замовлення доставкою, чию
// адресу ще не вдалось прив'язати до жодної точки (немає координат або
// геокодування не спрацювало).
const pointBots = {
  'kyiv-berestejskyi': {
    token: process.env.TELEGRAM_KEY_KYIV_BERESTEJSKYI,
    chatId: process.env.TELEGRAM_CHAT_ID_KYIV_BERESTEJSKYI,
  },
  'kyiv-dragomanova': {
    token: process.env.TELEGRAM_KEY_KYIV_DRAGOMANOVA,
    chatId: process.env.TELEGRAM_CHAT_ID_KYIV_DRAGOMANOVA,
  },
  'kharkiv-valentynivska': {
    token: process.env.TELEGRAM_KEY_KHARKIV_VALENTYNIVSKA,
    chatId: process.env.TELEGRAM_CHAT_ID_KHARKIV_VALENTYNIVSKA,
  },
  'kharkiv-divisions': {
    token: process.env.TELEGRAM_KEY_KHARKIV_DIVISIONS,
    chatId: process.env.TELEGRAM_CHAT_ID_KHARKIV_DIVISIONS,
  },
  'kharkiv-svobody': {
    token: process.env.TELEGRAM_KEY_KHARKIV_SVOBODY,
    chatId: process.env.TELEGRAM_CHAT_ID_KHARKIV_SVOBODY,
  },
};

// The owner's private bot — a copy of every order from every point lands
// here, regardless of which per-point/default bot handled it above. Not the
// same as the default bot (that one is the admins' shared fallback group).
// Leave both blank to turn the copy off.
const ownerBot = {
  token: process.env.TELEGRAM_KEY_OWNER,
  chatId: process.env.TELEGRAM_CHAT_ID_OWNER,
};

const botInstances = new Map();

const getBotInstance = (token) => {
  if (!botInstances.has(token)) {
    botInstances.set(token, new Telegraf(token));
  }
  return botInstances.get(token);
};

const resolveBot = (order) => {
  // pickupPointId now means "which point prepares this" for delivery
  // orders too (resolved server-side from the geocoded address), not just
  // which counter the customer walks up to for pickup.
  if (order.pickupPointId) {
    const custom = pointBots[order.pickupPointId];
    if (custom?.token && custom?.chatId) return custom;
  }
  return defaultBot;
};

const formatRequestedTime = (data) => {
  if (!data.requestedTime) return 'не вказано';
  return data.requestedTime === 'asap' ? 'Якнайшвидше' : data.requestedTime;
};

const formatFulfillment = (data) => {
  const city = CITY_LABELS[data.city] || data.city;

  if (data.fulfillment === 'pickup') {
    return `Самовивіз, ${city}, ${data.pickupAddress || 'адреса не вказана'}`;
  }

  // The address picker puts the full street+building address into
  // `street` and leaves `building` empty; older orders (and the manual
  // fallback when Maps fails to load) still store them separately.
  const addressLine = data.building
    ? `вул. ${data.street}, буд. ${data.building}`
    : data.street;

  const extras = data.isPrivateHouse
    ? ['приватний будинок']
    : [
        data.apartment ? `кв. ${data.apartment}` : null,
        data.entrance ? `під'їзд ${data.entrance}` : null,
        data.floor ? `поверх ${data.floor}` : null,
      ].filter(Boolean);

  return `Доставка, ${city}, ${addressLine}${extras.length ? `, ${extras.join(', ')}` : ''}`;
};

const sendVia = ({ token, chatId }, message) =>
  getBotInstance(token).telegram.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
  });

const formatCutlery = (data) => {
  const count = data.cutlery ?? 0;
  return data.trainingChopsticks
    ? `${count} + навчальні палички`
    : String(count);
};

const formatPayment = (data) => {
  if (data.paymentMethod === 'online') return 'Онлайн';
  if (data.cashAmount) {
    return `При отриманні, готівка ${data.cashAmount} грн — решта ${data.cashAmount - data.total} грн`;
  }
  return 'При отриманні';
};

const formatPoint = (data) => {
  const point = PICKUP_POINTS.find((p) => p.id === data.pickupPointId);
  return point
    ? `${CITY_LABELS[point.city]}, ${point.address}`
    : 'не визначено';
};

const buildOrderMessage = (data) =>
  [
    '🛒 Замовлення',
    '',
    `👤 Ім'я: ${data.name}`,
    `📞 Телефон: [${data.phoneNumber}](tel:${data.phoneNumber})`,
    `🚚 ${formatFulfillment(data)}`,
    // Pickup already names its point in the line above.
    data.fulfillment === 'delivery'
      ? `📍 Готує точка: ${formatPoint(data)}`
      : null,
    `🕒 Час: ${formatRequestedTime(data)}`,
    `🥢 Прибори: ${formatCutlery(data)}`,
    `📝 Деталі: ${data.details || 'Не вказані'}`,
    `💳 Оплата: ${formatPayment(data)}`,
    data.noCallback ? '🔕 Просив(ла) не передзвонювати' : null,
    '',
    '🍣 *Товари*:',
    ...data.items.map(
      (item) => `- ${item.productName} x${item.quantity} по ${item.price} грн`,
    ),
    '',
    data.deliveryFee ? `🚗 Доставка: ${data.deliveryFee} грн` : null,
    `💰 Разом: ${data.total} грн`,
    '',
    `⏳ *Дата замовлення*: ${new Date(data.createdAt).toLocaleString('uk-UA', { timeZone: 'Europe/Kyiv' })}`,
  ]
    .filter((line) => line !== null)
    .join('\n');

export const sendOrderToTelegram = async (data) => {
  const orderMessage = buildOrderMessage(data);

  const primary = resolveBot(data);

  try {
    return await sendVia(primary, orderMessage);
  } catch (err) {
    // A misconfigured per-point bot (wrong chat_id, bot not added to that
    // group, etc.) used to mean the order notification vanished entirely —
    // resolveBot had already committed to the custom bot, so there was no
    // second attempt. Falling back to the default bot means a broken
    // per-point setup degrades to "wrong group" instead of "no one sees
    // the order at all".
    if (primary === defaultBot) throw err;

    console.error(
      `Failed to send via the custom bot for pickupPointId="${data.pickupPointId}" — falling back to the default bot`,
      err,
    );
    return await sendVia(defaultBot, orderMessage);
  }
};

export const sendOrderToOwnerTelegram = async (data) => {
  if (!ownerBot.token || !ownerBot.chatId) return;
  return await sendVia(ownerBot, buildOrderMessage(data));
};

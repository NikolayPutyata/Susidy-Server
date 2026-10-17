import { Telegraf } from 'telegraf';
import { CITY_LABELS } from '../constants/index.js';

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

  const apartment = data.isPrivateHouse ? 'приватний будинок' : `кв. ${data.apartment}`;
  return `Доставка, ${city}, вул. ${data.street}, буд. ${data.building}, ${apartment}`;
};

const sendVia = ({ token, chatId }, message) =>
  getBotInstance(token).telegram.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
  });

export const sendOrderToTelegram = async (data) => {
  const orderMessage = `
    🛒 Замовлення

    👤 Ім'я: ${data.name}
    📞 Телефон: [${data.phoneNumber}](tel:${data.phoneNumber})
    🚚 ${formatFulfillment(data)}
    🕒 Час: ${formatRequestedTime(data)}
    🍴 Приборів: ${data.cutlery || 1}
    📝 Деталі: ${data.details || 'Не вказані'}
    💳 Оплата: ${data.paymentMethod === 'online' ? 'Онлайн' : 'При отриманні'}
    ${data.noCallback ? '🔕 Просив(ла) не передзвонювати' : ''}

    🍣 **Товари**:
    ${data.items
      .map(
        (item) => `
      - ${item.productName} x${item.quantity} по ${item.price} грн
    `,
      )
      .join('')}

    💰 Разом: ${data.total} грн

    ⏳ **Дата замовлення**: ${new Date(data.createdAt).toLocaleString()}
  `;

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

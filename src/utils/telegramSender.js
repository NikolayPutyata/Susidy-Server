import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_KEY);
const chatId = process.env.TELEGRAM_CHAT_ID;

const CITY_LABELS = { kyiv: 'Київ', kharkiv: 'Харків' };

const formatFulfillment = (data) => {
  const city = CITY_LABELS[data.city] || data.city;

  if (data.fulfillment === 'pickup') {
    return `Самовивіз, ${city}, ${data.pickupAddress || 'адреса не вказана'}`;
  }

  const apartment = data.isPrivateHouse ? 'приватний будинок' : `кв. ${data.apartment}`;
  return `Доставка, ${city}, вул. ${data.street}, буд. ${data.building}, ${apartment}`;
};

export const sendOrderToTelegram = async (data) => {
  const orderMessage = `
    🛒 Замовлення

    👤 Ім'я: ${data.name}
    📞 Телефон: [${data.phoneNumber}](tel:${data.phoneNumber})
    🚚 ${formatFulfillment(data)}
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

  const result = await bot.telegram.sendMessage(chatId, orderMessage, {
    parse_mode: 'Markdown',
  });

  return result;
};

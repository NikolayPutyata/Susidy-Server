import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_KEY);
const chatId = process.env.TELEGRAM_CHAT_ID;

export const sendOrderToTelegram = async (data) => {
  const orderMessage = `
    🛒 Замовлення

    👤 Ім'я: ${data.name}
    📞 Телефон: [${data.phoneNumber}](tel:${data.phoneNumber})
    🚚 Доставка: ${data.delivery || 'Не вказана'}
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

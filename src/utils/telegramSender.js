import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_KEY);
const chatId = process.env.TELEGRAM_CHAT_ID;

export const sendOrderToTelegram = async (data) => {
  const result = await bot.telegram.sendMessage(chatId, data);
  return result;
};

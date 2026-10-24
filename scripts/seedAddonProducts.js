import 'dotenv/config';
import mongoose from 'mongoose';
import { ProductsCollection } from '../src/db/models/products.js';
import { getEnvVar } from '../src/utils/getEnvVar.js';

// Placeholder prices only — the admin must set the real ones in the admin
// panel before launch. Kept idempotent (upsert by addonType) so re-running
// this script never creates duplicates.
const ADDON_PRODUCTS = [
  {
    addonType: 'sauce',
    name: 'Соус',
    nameEn: 'Sauce',
    priceKiev: 10,
    priceKharkov: 10,
  },
  {
    addonType: 'ginger',
    name: 'Імбир',
    nameEn: 'Ginger',
    priceKiev: 10,
    priceKharkov: 10,
  },
  {
    addonType: 'wasabi',
    name: 'Васабі',
    nameEn: 'Wasabi',
    priceKiev: 10,
    priceKharkov: 10,
  },
];

const run = async () => {
  await mongoose.connect(getEnvVar('MONGODB_URI'));

  for (const data of ADDON_PRODUCTS) {
    const product = await ProductsCollection.findOneAndUpdate(
      { addonType: data.addonType },
      {
        $set: { ...data, category: 'other' },
        $setOnInsert: { images: [] },
      },
      { upsert: true, new: true },
    );
    console.log(
      `Addon ready: ${product.name} (${product._id}) — placeholder price ${product.priceKiev}/${product.priceKharkov} ₴, update it in the admin panel before launch`,
    );
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed to seed addon products', err);
  process.exit(1);
});

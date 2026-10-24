import { model, Schema } from 'mongoose';

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    priceKiev: { type: Number, required: true },
    priceKharkov: { type: Number, required: true },
    category: {
      type: String,
      enum: [
        'rolls',
        'sushi',
        'hotRolls',
        'hunkans',
        'sets',
        'drinks',
        'maki',
        'bigRolls',
        'other',
      ],
      default: 'other',
      required: true,
    },
    // Marks this item as sauce/ginger/wasabi so the cart's free-addon
    // auto-add system (see services/cart.js) can recognize it generically
    // instead of matching on name — null for every ordinary product.
    addonType: {
      type: String,
      enum: ['sauce', 'ginger', 'wasabi'],
      default: null,
    },
    images: { type: [String], required: true },
    description: { type: String },
    // English translations shown when the site is switched to EN — falls
    // back to the Ukrainian name/description client-side while unset, so
    // these are optional and filled in by hand per item.
    nameEn: { type: String },
    descriptionEn: { type: String },
    weight: { type: Number },
    // Ingredients — for a set, the admin lists the rolls/items it's made
    // of here too, as free text (no structured reference to other
    // products — simplest way to describe a set's contents).
    composition: { type: String },
    // Ingredient ids from the fixed dictionary in constants/ingredients.js
    // (picked with chips in the admin form, never typed) driving the roll
    // category's ingredient filters — kept separate from the free-text
    // `composition` above so filtering doesn't depend on word-matching.
    // Validated against the dictionary in validation/products.js (Joi), not
    // here, so documents still holding pre-dictionary free-text tags keep
    // loading/saving until scripts/migrateIngredients.js converts them.
    ingredients: { type: [String], default: [] },
    allergens: { type: String },
    // The matching product's id in Poster POS's own menu catalog — set by
    // hand per item (Poster has no stable way to match by name). Empty
    // means this item isn't mapped yet; an order containing it just isn't
    // pushed to Poster (see utils/posterSender.js).
    posterProductId: { type: String },
    // Pickup point IDs where this item is currently "put on stop" by an
    // admin — availability elsewhere (other points, delivery) is
    // unaffected.
    stoppedPoints: { type: [String], default: [] },
    // Manually curated for the homepage's "Обирають найчастіше" carousel —
    // featuredOrder is a plain number the admin sets by hand (lower sorts
    // first), same pattern as banners' own `order`.
    featured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },
    // Same curation pattern as featured/featuredOrder, for the separate
    // "Роли від шефа" carousel below the category tiles.
    chefsPick: { type: Boolean, default: false },
    chefsPickOrder: { type: Number, default: 0 },
    // Nutrition per 100g (Б/Ж/В) — optional, filled in by hand per item;
    // the product detail modal only shows this block when at least one is
    // set.
    proteins: { type: Number },
    fats: { type: Number },
    carbs: { type: Number },
  },
  { timestamps: true, versionKey: false },
);

export const ProductsCollection = model('products', productSchema);

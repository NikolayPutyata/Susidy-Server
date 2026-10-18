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
    images: { type: [String], required: true },
    description: { type: String },
    weight: { type: Number },
    // Ingredients — for a set, the admin lists the rolls/items it's made
    // of here too, as free text (no structured reference to other
    // products — simplest way to describe a set's contents).
    composition: { type: String },
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
  },
  { timestamps: true, versionKey: false },
);

export const ProductsCollection = model('products', productSchema);

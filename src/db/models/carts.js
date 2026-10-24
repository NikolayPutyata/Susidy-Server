import { model, Schema } from 'mongoose';

const cartSchema = new Schema(
  {
    user_id: { type: String, required: true, unique: true },
    items: [
      {
        product_id: String,
        productName: String,
        quantity: Number,
        price: Number,
        image: String,
        // Snapshotted from the product at add-to-cart time (same pattern
        // as productName/price/image above) so weight-based display and
        // addon-aware calculations don't need a live product lookup.
        weight: Number,
        addonType: { type: String, enum: ['sauce', 'ginger', 'wasabi'], default: null },
        // Snapshotted so the free-addon system can tell rolls from sets
        // from everything else without a live product lookup.
        category: String,
        // Current free allowance baked into this line by the free-addon
        // system (services/cart.js::recomputeAddons) — 0 for main items.
        // Lets a manual +/- edit be told apart from the system's own
        // grant on the next recompute, so it isn't silently reset.
        freeQuantity: { type: Number, default: 0 },
        _id: false,
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

export const CartsCollection = model('carts', cartSchema);

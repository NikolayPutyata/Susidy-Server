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
        _id: false,
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

export const CartsCollection = model('carts', cartSchema);

import { model, Schema } from 'mongoose';

const cartSchema = new Schema(
  {
    user_id: { type: String },
    session_id: { type: String },
    items: [
      {
        product_id: String,
        productName: String,
        quantity: Number,
        price: Number,
      },
    ],
  },
  { timestamps: true, versionKey: false },
);

export const CartsCollection = model('carts', cartSchema);

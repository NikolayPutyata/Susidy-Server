import { model, Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    session_id: { type: String, required: true },
    name: { type: String, required: true },
    phoneNumber: { type: Number, required: true },
    items: [
      {
        product_id: String,
        productName: String,
        quantity: Number,
        price: Number,
      },
    ],
    total: Number,
  },
  { timestamps: true, versionKey: false },
);

export const OrdersCollection = model('orders', orderSchema);
